import { Appearance } from 'react-native';
import { makePersistable } from 'mobx-persist-store';
import { makeAutoObservable, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeEventEmitter } from 'react-native';
import { deleteAllSecrets, getSecret, secretNames, setSecret } from '@/utils/secureStorage';

export type StorageKeys =
  'onboarding_welcome_completed' |
  'onboarding_model_selection_completed' |
  'onboarding_survey_completed' |
  'onboarding_data_handling_completed' |
  'llmPreference' |
  'tools' |
  'current_anythingllm_external_connection' |
  'anythingllm_external_connections' |
  'hf_imported_models' |
  'provider_config_cache' |
  'native_config_cache' |
  'memories' |
  'fs_cleanup_last_run' |
  'highlights_last_seen_version' |
  'assistant_auto_listen' |
  'assistant_auto_screenshot' |
  'tool_auto_approvals' |
  'chatgpt_host_id' |
  'chatgpt_client_id' |
  'chatgpt_plan_notice_seen' |
  'web_search_config';

export const GLOBAL_EVENTS = {
  REDIRECT: 'REDIRECT',
  CITATIONS_FOCUSED: 'CITATIONS_FOCUSED',
  /** A chat message was long-pressed - payload is { chat, role } - opens the message actions sheet */
  MESSAGE_ACTIONS_FOCUSED: 'MESSAGE_ACTIONS_FOCUSED',
  /** A text or email draft card wants to pick an app - payload is `{ kind, draft }` - opens the draft sheet */
  DRAFT_FOCUSED: 'DRAFT_FOCUSED',
  SUBMIT_PROMPT: 'SUBMIT_PROMPT',
  REFRESH_WORKSPACES: 'REFRESH_WORKSPACES',
  CHAT_HISTORY_REFRESHED: 'CHAT_HISTORY_REFRESHED',
  MODEL_DOWNLOAD_STARTED: 'MODEL_DOWNLOAD_STARTED',
  MODEL_DOWNLOAD_COMPLETE: 'MODEL_DOWNLOAD_COMPLETE',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
  ONBOARDING_RESET: 'ONBOARDING_RESET',
  /**
   * Another React root (the Quick Actions card) used the shared LLM provider with its own workspace and
   * has gone away - mounted chat screens re-attach their workspace so RAG and the system prompt are right.
   */
  WORKSPACE_REATTACH_REQUESTED: 'WORKSPACE_REATTACH_REQUESTED',
} as const;

export class UIStore {
  emitter: NativeEventEmitter;
  globalEvents = GLOBAL_EVENTS;

  static readonly GROUP_KEYS = {
    READY_TO_USE: 'ready_to_use',
    AVAILABLE_TO_DOWNLOAD: 'available_to_download',
  } as const;
  static readonly STORAGE_KEYS: StorageKeys[] = [
    'onboarding_welcome_completed',
    'onboarding_model_selection_completed',
    'onboarding_survey_completed',
    'onboarding_data_handling_completed',
    'llmPreference',
    'tools',
    'current_anythingllm_external_connection',
    'anythingllm_external_connections',
    'hf_imported_models',
    'provider_config_cache',
    'native_config_cache',
    'memories',
    'fs_cleanup_last_run',
    'highlights_last_seen_version',
    'assistant_auto_listen',
    'assistant_auto_screenshot',
    'tool_auto_approvals',
    'chatgpt_host_id',
    'chatgpt_client_id',
    'chatgpt_plan_notice_seen',
    'web_search_config',
  ] as const;

  pageStates = {
    modelsScreen: {
      filters: [] as string[],
      expandedGroups: {
        [UIStore.GROUP_KEYS.READY_TO_USE]: true,
      },
    },
  };

  // This is a flag to auto-navigate to the chat page after loading a model
  autoNavigatetoChat = true;

  //colorScheme = useColorScheme();
  colorScheme: 'light' | 'dark' = Appearance.getColorScheme() ?? 'light';

  displayMemUsage = false;

  benchmarkShareDialog = {
    shouldShow: true,
  };

  storage = AsyncStorage;

  session = new Map<string, any>();

  showError(message: string) {
    // TODO: Implement error display logic (e.g., toast, alert, etc.)
    console.error(message);
  }

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'UIStore',
      properties: [
        'pageStates',
        'colorScheme',
        'autoNavigatetoChat',
        'displayMemUsage',
        'benchmarkShareDialog',
      ],
      storage: AsyncStorage,
    });

    this.emitter = new NativeEventEmitter();
  }

  async removeFromStorage(key: StorageKeys) {
    return this.storage.removeItem(key);
  }

  /**
   * Provider API keys never live in AsyncStorage: they are moved to the Android Keystore-backed
   * keychain (see utils/secureStorage). These are the stored structures that can carry one.
   *  - llmPreference:         `{ provider, config: { apiKey, ... } }`
   *  - provider_config_cache: `{ [provider]: { apiKey, ... } }`
   */
  private static readonly SECRET_BEARING_KEYS: StorageKeys[] = ['llmPreference', 'provider_config_cache'];

  /** Returns a copy of `value` with its API keys removed after saving them in the keychain. */
  private async protectSecrets(key: StorageKeys, value: any): Promise<any> {
    if (!value || typeof value !== 'object') return value;
    if (key === 'llmPreference') {
      const provider = value.provider;
      if (!provider || !value.config || typeof value.config !== 'object') return value;
      const apiKey = typeof value.config.apiKey === 'string' ? value.config.apiKey : '';
      const stored = await setSecret(secretNames.llmPreference(provider), apiKey);
      // If the keystore refused, keep the key where it was so the app keeps working.
      return stored ? { ...value, config: { ...value.config, apiKey: '' } } : value;
    }
    if (key === 'provider_config_cache') {
      const result: Record<string, any> = {};
      for (const [provider, config] of Object.entries<any>(value)) {
        const apiKey = config && typeof config.apiKey === 'string' ? config.apiKey : '';
        const stored = config ? await setSecret(secretNames.providerCache(provider), apiKey) : true;
        result[provider] = stored && config ? { ...config, apiKey: '' } : config;
      }
      return result;
    }
    return value;
  }

  /**
   * Puts keychain-held API keys back into a value read from storage. Values saved by older builds
   * still carry the key in plain text: those are migrated into the keychain on first read.
   * Returns the hydrated value and whether the stored copy should be rewritten without the key.
   */
  private async revealSecrets(key: StorageKeys, value: any): Promise<{ value: any; migrated: boolean }> {
    if (!value || typeof value !== 'object') return { value, migrated: false };
    let migrated = false;
    if (key === 'llmPreference') {
      const provider = value.provider;
      if (!provider || !value.config || typeof value.config !== 'object') return { value, migrated };
      const name = secretNames.llmPreference(provider);
      if (typeof value.config.apiKey === 'string' && value.config.apiKey) {
        migrated = await setSecret(name, value.config.apiKey);
        return { value, migrated };
      }
      const secret = await getSecret(name);
      return { value: secret ? { ...value, config: { ...value.config, apiKey: secret } } : value, migrated };
    }
    if (key === 'provider_config_cache') {
      const result: Record<string, any> = {};
      for (const [provider, config] of Object.entries<any>(value)) {
        if (!config || typeof config !== 'object') { result[provider] = config; continue; }
        const name = secretNames.providerCache(provider);
        if (typeof config.apiKey === 'string' && config.apiKey) {
          if (await setSecret(name, config.apiKey)) migrated = true;
          result[provider] = config;
          continue;
        }
        const secret = await getSecret(name);
        result[provider] = secret ? { ...config, apiKey: secret } : config;
      }
      return { value: result, migrated };
    }
    return { value, migrated };
  }

  async getFromStorage<T>(key: StorageKeys, defaultValue: T): Promise<T> {
    const raw = await this.storage.getItem(key);
    if (!raw) return defaultValue as T;
    const parsed = JSON.parse(raw);
    if (!UIStore.SECRET_BEARING_KEYS.includes(key)) return parsed as T;
    const { value, migrated } = await this.revealSecrets(key, parsed);
    // Legacy plain-text key was just copied into the keychain: drop it from AsyncStorage.
    if (migrated) {
      const stripped = await this.protectSecrets(key, value);
      await this.storage.setItem(key, JSON.stringify(stripped));
    }
    return value as T;
  }

  async setToStorage<T>(key: StorageKeys, value: T) {
    const persisted = UIStore.SECRET_BEARING_KEYS.includes(key) ? await this.protectSecrets(key, value) : value;
    const result = await this.storage.setItem(key, JSON.stringify(persisted));
    // Listeners (eg. the LLM preference context) get the full value in memory.
    this.emitter.emit(key, { details: value });
    return result;
  }

  async getAllFromStorage(): Promise<{ [key: string]: any }> {
    return this.storage.multiGet(UIStore.STORAGE_KEYS)
      .then((result) => {
        return result.map(([key, value]) => {
          return {
            [key]: value,
          };
        });
      });
  }

  setValue<T extends keyof typeof this.pageStates>(
    page: T,
    key: keyof (typeof this.pageStates)[T],
    value: any,
  ) {
    runInAction(() => {
      if (this.pageStates[page]) {
        this.pageStates[page][key] = value;
      } else {
        console.error(`Page '${page}' does not exist in pageStates`);
      }
    });
  }

  setColorScheme(colorScheme: 'light' | 'dark') {
    runInAction(() => {
      this.colorScheme = colorScheme;
    });
  }

  setAutoNavigateToChat(value: boolean) {
    runInAction(() => {
      this.autoNavigatetoChat = value;
    });
  }

  setDisplayMemUsage(value: boolean) {
    runInAction(() => {
      this.displayMemUsage = value;
    });
  }

  setBenchmarkShareDialogPreference(shouldShow: boolean) {
    runInAction(() => {
      this.benchmarkShareDialog.shouldShow = shouldShow;
    });
  }

  emitGlobalEvent(event: typeof GLOBAL_EVENTS[keyof typeof GLOBAL_EVENTS], details?: { path: string, params?: object }) {
    this.emitter.emit(event, { ...details });
  }

  async resetAllStorage() {
    await deleteAllSecrets();
    return await this.storage.multiRemove(UIStore.STORAGE_KEYS);
  }

  setSessionKey(key: string, value: any, eventToEmit?: typeof GLOBAL_EVENTS[keyof typeof GLOBAL_EVENTS]) {
    this.session.set(key, value);
    if (eventToEmit) this.emitter.emit(eventToEmit, { details: value });
  }

  deleteSessionKey(key: string, eventToEmit?: typeof GLOBAL_EVENTS[keyof typeof GLOBAL_EVENTS]) {
    this.session.delete(key);
    if (eventToEmit) this.emitter.emit(eventToEmit);
  }
}

const uiStore = new UIStore();
export default uiStore;