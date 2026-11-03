import React, { useCallback, useState } from 'react';
import { Alert, FlatList, NativeEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { DotsThreeVertical, Folders, Plus } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import NexSkeleton from '@/components/nex/NexSkeleton';
import { NexBadge, NexCard, NexEmptyState, NexIconTile, NexRow } from '@/components/nex/primitives';
import NexTextPrompt from '@/components/nex/NexTextPrompt';
import NexPickerModal from '@/components/nex/NexPickerModal';
import { NEX } from '@/components/nex/tokens';
import NewWorkspaceModal, { useNewWorkspaceModal } from '@/components/NewWorkspaceModal';
import useNexData from '@/hooks/useNexData';
import Workspace from '@/database/models/Workspace';
import { listWorkspaceSummaries, type WorkspaceSummary } from '@/utils/nex/data';
import { openWorkspace } from '@/utils/nex/actions';
import { resetTo } from '@/utils/nex/navigation';
import { PATHS } from '@/utils/paths';
import { showToast } from '@/utils/Notification';

const eventEmitter = new NativeEventEmitter();

export default function Workspaces() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data, loading, refreshing, refresh, error } = useNexData(listWorkspaceSummaries, [] as WorkspaceSummary[]);
  const { showNewWorkspaceModal, openNewWorkspaceModal, closeNewWorkspaceModal } = useNewWorkspaceModal();
  const [renaming, setRenaming] = useState<WorkspaceSummary | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const rename = useCallback(async (value: string) => {
    if (!renaming) return;
    const check = Workspace.writableFields.name.validate(value);
    if (!check.valid) return setRenameError(check.error);
    try {
      await Workspace.update([{ field: 'slug', value: renaming.slug }], { name: value });
      eventEmitter.emit('reloadWorkspaces'); // refreshes the drawer's list
      setRenaming(null);
      setRenameError(null);
      refresh();
    } catch (e) {
      console.error('[Workspaces] rename failed', e);
      showToast(t('nex.common.something_wrong'));
    }
  }, [renaming, refresh, t]);

  const remove = useCallback((workspace: WorkspaceSummary) => {
    Alert.alert(
      t('nex.workspaces.delete_title', { name: workspace.name }),
      t('nex.workspaces.delete_message', { chats: workspace.threadCount, docs: workspace.documentCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const ok = await Workspace.delete([{ field: 'slug', value: workspace.slug }]);
            if (!ok) return showToast(t('nex.common.something_wrong'));
            eventEmitter.emit('workspaceUpdate', { type: 'remove-workspace', details: { workspaceSlug: workspace.slug } });
            refresh();
          },
        },
      ],
    );
  }, [refresh, t]);

  // Android's Alert shows at most 3 buttons, so the per-workspace menu is a picker sheet instead
  const [menuFor, setMenuFor] = useState<WorkspaceSummary | null>(null);
  const actions = useCallback((workspace: WorkspaceSummary) => setMenuFor(workspace), []);
  const onMenuSelect = useCallback((key: string) => {
    const workspace = menuFor;
    setMenuFor(null);
    if (!workspace) return;
    if (key === 'open') openWorkspace(navigation, workspace.slug);
    else if (key === 'documents') resetTo(navigation, PATHS.documents, { workspaceSlug: workspace.slug });
    else if (key === 'settings') resetTo(navigation, PATHS.workspace_settings, { wsSlug: workspace.slug });
    else if (key === 'rename') { setRenameError(null); setRenaming(workspace); }
    else if (key === 'delete') remove(workspace);
  }, [menuFor, navigation, remove]);

  return (
    <NexScreen
      title={t('nex.nav.workspaces')}
      activeTab="workspaces"
      scroll={false}
      headerRight={
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('nex.home.create_workspace')} onPress={openNewWorkspaceModal} style={styles.add}>
          <Plus size={22} color={NEX.onCyan} weight="bold" />
        </TouchableOpacity>
      }>
      <FlatList
        data={data}
        keyExtractor={(w) => w.slug}
        initialNumToRender={10}
        windowSize={7}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? <NexSkeleton rows={4} /> : error ? (
            <NexEmptyState title={t('nex.common.load_failed')} message={error} actionLabel={t('nex.common.retry')} onAction={refresh} />
          ) : (
            <NexEmptyState icon={<Folders size={40} color={NEX.cyan} />} title={t('nex.workspaces.empty_title')} message={t('nex.workspaces.empty_message')} actionLabel={t('nex.home.create_workspace')} onAction={openNewWorkspaceModal} />
          )
        }
        renderItem={({ item }) => (
          <NexCard style={{ marginBottom: 10 }}>
            <NexRow
              icon={<NexIconTile><Folders size={22} color={NEX.cyan} /></NexIconTile>}
              title={item.name}
              subtitle={t('nex.workspaces.counts', { chats: item.threadCount, docs: item.documentCount })}
              onPress={() => openWorkspace(navigation, item.slug)}
              trailing={
                <View style={styles.trailing}>
                  {item.isRemote ? <NexBadge label={t('nex.workspaces.remote')} tone="warning" /> : null}
                  <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel={t('nex.common.more_actions')} onPress={() => actions(item)}>
                    <DotsThreeVertical size={22} color={NEX.textSecondary} weight="bold" />
                  </TouchableOpacity>
                </View>
              }
            />
          </NexCard>
        )}
      />
      <NexPickerModal
        visible={!!menuFor}
        title={menuFor?.name ?? ''}
        items={[
          { key: 'open', title: t('nex.workspaces.open') },
          { key: 'documents', title: t('nex.workspaces.documents') },
          { key: 'settings', title: t('nex.workspaces.settings') },
          { key: 'rename', title: t('nex.common.rename') },
          { key: 'delete', title: t('common.delete') },
        ]}
        onClose={() => setMenuFor(null)}
        onSelect={(item) => onMenuSelect(item.key)}
      />
      <NewWorkspaceModal showing={showNewWorkspaceModal} close={closeNewWorkspaceModal} />
      <NexTextPrompt
        visible={!!renaming}
        title={t('nex.workspaces.rename_title')}
        initialValue={renaming?.name ?? ''}
        confirmLabel={t('common.save')}
        error={renameError}
        onCancel={() => setRenaming(null)}
        onConfirm={rename}
      />
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  add: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: NEX.cyan },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
