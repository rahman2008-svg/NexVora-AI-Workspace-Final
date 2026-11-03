import * as RNFS from '@dr.pogodin/react-native-fs';
import { isDebugMode } from '@/utils/constants';

/**
 * Local-only event/diagnostics facade.
 *
 * NexVora AI Workspace does NOT send analytics or crash reports anywhere: the Firebase Analytics and
 * Crashlytics SDKs were removed from this fork. This class keeps the same API the rest of the app was
 * written against (`logEvent`, `recordError`, `trackNativeModelLoad`, ...), so no call site had to change,
 * but every method only writes to the local JS console (and only in debug builds).
 */
class Telemetry {
    private static instance: Telemetry;

    /**
     * Event names used across the app. Kept so call sites stay type-safe; nothing is transmitted.
     */
    CUSTOM_EVENTS = {
        ONBOARDING: {
            COMPLETED: 'onboarding_completed',
            SURVEY_RESPONSE: 'onboarding_survey_response',
        },
        ACTIONS: {
            WORKSPACE_CREATED: 'workspace_created',
            CHAT_COMPLETED: 'chat_completed',
            /** The user pressed stop while a reply was generating - nothing was saved */
            CHAT_ABORTED: 'chat_aborted',
            /** A document was attached to a workspace (payload: documentType, mode = embedded | full) */
            DOCUMENT_IMPORTED: 'document_added',
            /** An image was attached to a prompt from the gallery, the camera or the share sheet (payload: source) */
            IMAGE_ATTACHED: 'image_attached',
            /** Another app shared files/images to NexVora AI Workspace through the share sheet (payload: files, images) */
            CONTENT_SHARED: 'content_shared',
            /** An anythingllm://pull-hf link (Hugging Face "Use this model") opened the on-device picker (payload: repo, hasFile) */
            HF_PULL_LINK_OPENED: 'hf_pull_link_opened',
            /** Text highlighted in another app was sent to the Quick Actions card (payload: mode, action) */
            QUICK_CONTEXT_USED: 'quick_context_used',
            /** The selection-toolbar entry was switched on or off in Settings > Special tools (payload: enabled) */
            QUICK_CONTEXT_TOGGLED: 'quick_context_toggled',
            /** "Set up" / "Change" in Settings > Device Assistant, which opens Android's assistant settings (payload: alreadyDefault) */
            ASSISTANT_SETUP_OPENED: 'assistant_setup_opened',
            /** The assist gesture opened the assistant overlay */
            ASSISTANT_INVOKED: 'assistant_invoked',
            /** A prompt was sent from the assistant overlay (payload: screenshot, voice, followUp) */
            ASSISTANT_CHAT_SENT: 'assistant_chat_sent',
            /** An assistant behavior was switched in Settings > Assistant (payload: preference, enabled) */
            ASSISTANT_PREFERENCE_TOGGLED: 'assistant_preference_toggled',
            /** A background theme was picked in Settings > Assistant (payload: theme) */
            ASSISTANT_THEME_CHANGED: 'assistant_theme_changed',
            TOOL_CALLED: 'tool_called',
            /** The user switched a tool on from the tools sheet (payload: tool, provider) - disabling and suggestion-chip toggles are not tracked */
            TOOL_ENABLED: 'tool_enabled',
            LLM_SETTINGS_UPDATED: 'llm_settings_updated',
            /** A chat thread was exported (txt/md/json/pdf) and handed to the share sheet */
            THREAD_EXPORTED: 'thread_exported',
            /** A chat thread was forked into a new thread with a copy of its history */
            THREAD_FORKED: 'thread_forked',
            /** A user/assistant message pair was deleted from a thread */
            CHAT_DELETED: 'chat_deleted',
            /** A user/assistant message pair was removed and its prompt re-submitted */
            CHAT_RETRIED: 'chat_retried',
            /** The user switched the memory system on (disabling is not tracked) */
            MEMORIES_ENABLED: 'memories_enabled',
            /** The user saved a memory from the thread menu (payload: scope) */
            MEMORY_SAVED: 'memory_saved',
            /** A scheduled job was created (payload: tools count, notify) */
            SCHEDULED_JOB_CREATED: 'scheduled_job_created',
            SCHEDULED_JOB_RAN: 'scheduled_job_ran',
            /** The user approved a reminder from chat (payload: kind alarm|timer|calendar) */
            REMINDER_SET: 'reminder_set',
            /** The feature highlights carousel was dismissed (payload: audience new_user|upgrade, cards) */
            HIGHLIGHTS_VIEWED: 'highlights_viewed',

            /** The user used the QR code to connect to an AnythingLLM instance */
            EXTERNAL_CONNECTION_ESTABLISHED: 'external_connection_established',
            /** External workspace imported from the AnythingLLM Desktop */
            EXTERNAL_WORKSPACE_IMPORTED: 'external_workspace_imported',
        },
        /** The user switched anonymous telemetry off - the final event we send before going quiet */
        DISABLED_TELEMETRY: 'disabled_telemetry',
    } as const;

    constructor() {
        if (Telemetry.instance) return Telemetry.instance;
        Telemetry.instance = this;
    }

    log(message: any, ...args: any[]) {
        console.log(`\x1b[32m[Diagnostics]\x1b[0m`, message, ...args)
    }

    /** Records an event locally (debug builds only). Never leaves the device. */
    logEvent(name: string, params: Record<string, any> = {}) {
        if (isDebugMode) this.log(`Event: ${name}`, params);
    }

    /** Logs an error the app recovered from (eg. caught by an error boundary) to the local console. */
    recordError(error: Error, context?: string) {
        console.error('[Diagnostics] recovered error', context ?? '', error);
    }

    /**
     * Runs a llama.rn `initLlama` call and logs which GGUF is loading (local console only), which helps when a
     * native crash inside llama.cpp has no JS stack. Rethrows load errors unchanged.
     * @param kind - which runtime is loading, eg. "chat", "embedder", "reranker"
     * @param path - absolute path of the GGUF being loaded
     * @param details - extra context, eg. source (catalog/imported) or n_ctx
     */
    async trackNativeModelLoad<T>(
        kind: string,
        path: string,
        details: Record<string, string | number | boolean>,
        load: () => Promise<T>,
    ): Promise<T> {
        const file = path.split('/').pop() || path;
        if (isDebugMode) {
            const sizeMb = await RNFS.stat(path).then((s) => Math.round(Number(s.size) / (1024 * 1024))).catch(() => -1);
            this.log(`llama ${kind}: loading ${file} (${sizeMb}MB)`, details);
        }
        try {
            const result = await load();
            if (isDebugMode) this.log(`llama ${kind}: loaded ${file}`);
            return result;
        } catch (error) {
            if (isDebugMode) this.log(`llama ${kind}: failed to load ${file}`);
            throw error;
        }
    }

    /** Always false: no analytics are collected. */
    async isEnabled(): Promise<boolean> {
        return false;
    }

    /** No-op, kept for API compatibility. */
    async setEnabled(_enabled: boolean): Promise<void> {}
}

const telemetry = new Telemetry();
export default telemetry;
