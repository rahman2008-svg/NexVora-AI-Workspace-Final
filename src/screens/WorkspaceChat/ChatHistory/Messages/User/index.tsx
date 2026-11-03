import { Text, View, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { type DynamicChatMessage } from '@/screens/WorkspaceChat/ChatHistory';
import ImageAttachmentGrid, { isImageAttachment } from '@/components/ImageAttachmentGrid';
import { focusMessageActions } from '../focusMessageActions';

export default function UserMessage({ chat }: { chat: DynamicChatMessage }) {
  if (!chat.prompt) return null;
  const images = (chat.response?.attachments ?? []).filter(isImageAttachment);
  return (
    <View className="flex flex-row items-start w-full justify-end">
      <TouchableOpacity
        onLongPress={() => focusMessageActions(chat, 'user')}
        delayLongPress={500}
        activeOpacity={0.7}
        // Children align to the end and size themselves - the text bubble must not stretch to the
        // width of the image collage above it (a short prompt keeps a short bubble).
        style={{ maxWidth: '95%', alignItems: 'flex-end' }}>
        {images.length > 0 && <ImageAttachmentGrid images={images} style={{ marginBottom: 6 }} />}
        {/* NexVora: user bubbles use the brand gradient (cyan -> violet) at low opacity so text stays readable */}
        <LinearGradient
          colors={['rgba(34, 211, 238, 0.22)', 'rgba(139, 92, 246, 0.28)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%', borderRadius: 18, borderTopRightRadius: 6, borderWidth: 0.5, borderColor: 'rgba(148, 163, 184, 0.25)' }}>
          <Text className="text-white text-right" style={{ color: '#F8FAFC', lineHeight: 22 }}>{chat.prompt}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
