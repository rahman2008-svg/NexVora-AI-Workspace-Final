import React, { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CaretRight, ClockCountdown, Robot, ShieldCheck, Wrench } from 'phosphor-react-native';
import { Q } from '@nozbe/watermelondb';
import NexScreen from '@/components/nex/NexScreen';
import { NexBadge, NexCard, NexDivider, NexIconTile, NexRow, NexSectionHeader } from '@/components/nex/primitives';
import { NEX } from '@/components/nex/tokens';
import useNexData from '@/hooks/useNexData';
import useLLMPreference from '@/hooks/useLLMPreference';
import uiStore from '@/store/UIStore';
import ToolsManager, { toolSupportsProvider, TOOL_GROUPS, type ToolManagerTool } from '@/utils/ToolsManager';
import { database } from '@/database';
import ScheduledJob, { type ScheduledJobType } from '@/database/models/ScheduledJob';
import ScheduledJobRun from '@/database/models/ScheduledJobRun';
import { relativeTime } from '@/utils/nex/data';
import { resetTo } from '@/utils/nex/navigation';
import { PATHS } from '@/utils/paths';
import { showToast } from '@/utils/Notification';

type ToolRow = { tool: ToolManagerTool; on: boolean; available: boolean; needsSetup: boolean };

async function load() {
  const stored = await uiStore.getFromStorage<Record<string, boolean>>('tools', {});
  const tools: ToolRow[] = [];
  for (const tool of ToolsManager.configurableTools) {
    const on = stored.hasOwnProperty(tool.id) ? !!stored[tool.id] : tool.defaultEnabled;
    const needsSetup = tool.isAvailable ? !(await tool.isAvailable()) : false;
    tools.push({ tool, on, available: true, needsSetup });
  }
  const jobs = await ScheduledJob.find();
  const runs = (await database.get(ScheduledJobRun.table).query(Q.sortBy('started_at', Q.desc), Q.take(5)).fetch()) as any[];
  return { tools, jobs, runs: runs.map((r) => ({ uuid: r.uuid as string, jobUuid: r.jobUuid as string, status: r.status as string, startedAt: r.startedAt as number })) };
}

export default function Agents() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { llmPreferences } = useLLMPreference();
  const provider = llmPreferences?.provider;
  const { data, refresh, refreshing, error } = useNexData(load, { tools: [] as ToolRow[], jobs: [] as ScheduledJobType[], runs: [] as { uuid: string; jobUuid: string; status: string; startedAt: number }[] });
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = useCallback(async (row: ToolRow) => {
    if (busyId) return;
    setBusyId(row.tool.id);
    try {
      const turningOn = !row.on;
      // Same rule as the chat tools sheet: ask the tool for permission/setup before switching it on
      if (turningOn && row.tool.requestPermission && !(await row.tool.requestPermission())) {
        if (row.tool.permissionDeniedMessage) showToast(row.tool.permissionDeniedMessage);
        return;
      }
      const stored = await uiStore.getFromStorage<Record<string, boolean>>('tools', {});
      await uiStore.setToStorage('tools', { ...stored, [row.tool.id]: turningOn });
      ToolsManager.resetTools();
      refresh();
    } finally {
      setBusyId(null);
    }
  }, [busyId, refresh]);

  const jobName = (uuid: string) => data.jobs.find((j) => j.uuid === uuid)?.name ?? t('nex.agents.deleted_job');
  const groups = [
    { id: 'default', title: t('nex.agents.group_default') },
    { id: 'appConnections', title: t('nex.agents.group_apps') },
  ] as const;

  return (
    <NexScreen title={t('nex.nav.agents')} subtitle={t('nex.agents.subtitle')} refreshing={refreshing} onRefresh={refresh}>
      <NexCard>
        <NexRow
          icon={<NexIconTile tint={NEX.violet}><Robot size={24} color={NEX.violet} /></NexIconTile>}
          title={t('nex.agents.assistant_title')}
          subtitle={t('nex.agents.assistant_desc')}
        />
      </NexCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {groups.map((group) => {
        const rows = data.tools.filter((r) => r.tool.category === group.id);
        if (rows.length === 0) return null;
        return (
          <View key={group.id}>
            <NexSectionHeader title={group.title} />
            <NexCard>
              {rows.map((row, index) => {
                const supported = toolSupportsProvider(row.tool, provider);
                const groupMeta = row.tool.group ? TOOL_GROUPS[row.tool.group].name : null;
                return (
                  <View key={row.tool.id}>
                    {index > 0 ? <NexDivider /> : null}
                    <NexRow
                      icon={<NexIconTile size={36}><Wrench size={18} color={NEX.cyan} /></NexIconTile>}
                      title={row.tool.name}
                      subtitle={[groupMeta, row.tool.description].filter(Boolean).join(' · ')}
                      trailing={
                        <View style={styles.trailing}>
                          {row.on && row.needsSetup ? <NexBadge tone="warning" label={t('nex.agents.setup_required')} /> : null}
                          {!supported ? <NexBadge label={t('nex.agents.cloud_only')} /> : null}
                          <Switch
                            value={row.on && supported}
                            disabled={!supported || busyId === row.tool.id}
                            onValueChange={() => toggle(row)}
                            trackColor={{ false: NEX.surface, true: NEX.cyan }}
                            thumbColor={NEX.text}
                            accessibilityLabel={row.tool.name}
                          />
                        </View>
                      }
                    />
                  </View>
                );
              })}
            </NexCard>
          </View>
        );
      })}

      <NexSectionHeader title={t('nex.agents.configure')} />
      <NexCard>
        <NexRow icon={<NexIconTile size={36}><Wrench size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.web_search.title')} subtitle={t('nex.web_search.summary')} trailing={<CaretRight size={18} color={NEX.textSecondary} />} onPress={() => resetTo(navigation, PATHS.user_settings, { page: 'web_search' })} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><ShieldCheck size={18} color={NEX.cyan} /></NexIconTile>} title={t('settings.utility.tool_auto_approvals')} trailing={<CaretRight size={18} color={NEX.textSecondary} />} onPress={() => resetTo(navigation, PATHS.user_settings, { page: 'tool_auto_approvals' })} />
      </NexCard>

      <NexSectionHeader title={t('nex.agents.activity')} actionLabel={t('nex.agents.manage_jobs')} onAction={() => resetTo(navigation, PATHS.scheduled_jobs)} />
      <NexCard>
        <NexRow
          icon={<NexIconTile tint={NEX.violet} size={36}><ClockCountdown size={18} color={NEX.violet} /></NexIconTile>}
          title={t('nex.agents.jobs_count', { count: data.jobs.length })}
          subtitle={t('nex.agents.jobs_enabled', { count: data.jobs.filter((j) => j.enabled).length })}
          onPress={() => resetTo(navigation, PATHS.scheduled_jobs)}
        />
        {data.runs.length === 0 ? <Text style={styles.muted}>{t('nex.agents.no_runs')}</Text> : data.runs.map((run) => (
          <View key={run.uuid}>
            <NexDivider />
            <NexRow
              title={jobName(run.jobUuid)}
              subtitle={relativeTime(run.startedAt)}
              trailing={<NexBadge tone={run.status === 'completed' ? 'success' : run.status === 'running' || run.status === 'queued' ? 'brand' : 'danger'} label={t(`nex.agents.run_${run.status}`)} />}
            />
          </View>
        ))}
      </NexCard>
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { color: NEX.textSecondary, fontSize: 14, paddingTop: 8 },
  error: { color: NEX.danger, marginTop: 8 },
});
