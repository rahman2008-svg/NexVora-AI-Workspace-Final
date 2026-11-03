import useLLMPreference from '@/hooks/useLLMPreference';
import { findProviderDefinition, providerDisplayName } from '@/utils/llmproviders';

/** What the app will use for the next chat, straight from the saved LLM preference. */
export default function useCurrentModel() {
  const { llmPreferences, LLMProvider, isLoading } = useLLMPreference();
  const provider: string = llmPreferences?.provider ?? 'unknown';
  const configured = provider !== 'unknown' && !!findProviderDefinition(provider);
  const rawModel: string = llmPreferences?.config?.model ?? '';
  // On-device ids look like "org/repo/file.gguf"
  const model = rawModel.split('/').pop() ?? '';
  const isLocal = provider === 'native';
  // `runtimeInfo` is only non-null while llama.rn has the model in memory
  const loaded = isLocal ? !!(LLMProvider as any)?.runtimeInfo : null;
  return {
    isLoading,
    configured,
    provider,
    providerName: configured ? providerDisplayName(provider) : '',
    model,
    isLocal,
    loaded,
  };
}
