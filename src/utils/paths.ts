export const PATHS = {
  onboarding: {
    welcome: 'Welcome',
    model_selection: 'ModelSelection',
    survey: 'Survey',
    data_handling: 'DataHandling',
  },
  home: 'Home',
  workspace_chat: 'WorkspaceChat',
  workspace_settings: 'WorkspaceSettings',
  user_settings: 'UserSettings',
  scheduled_jobs: 'ScheduledJobs',
  // NexVora Phase 2 screens
  workspaces: 'Workspaces',
  documents: 'Documents',
  agents: 'Agents',
  models: 'Models',
  search: 'Search',
  chat_history: 'ChatHistory',
  profile: 'Profile',
  about: 'About',
  developer: {
    home: 'DevToolsMenu',
  },

  connect_to_instance: 'ConnectToInstance',

  /**
   * Update check is disabled until NexVora hosts its own `version.txt` (plain text, eg. `1.0.1`) and a store
   * listing. Leave empty to skip the check. Do NOT point these at the upstream AnythingLLM endpoints - they
   * announce upstream versions and link to the upstream app.
   */
  remote_version_url: '',
  google_play_store: '',
};