import OnboardingWelcome from "./Onboarding/Welcome";
import OnboardingModelSelection from "./Onboarding/ModelSelection";
import OnboardingSurvey from "./Onboarding/Survey";
import OnboardingDataHandling from "./Onboarding/DataHandling";

import Home from "./Nex/Home";
import Workspaces from "./Nex/Workspaces";
import Documents from "./Nex/Documents";
import Agents from "./Nex/Agents";
import Models from "./Nex/Models";
import Search from "./Nex/Search";
import ChatHistory from "./Nex/ChatHistory";
import Profile from "./Nex/Profile";
import About from "./Nex/About";
import UserSettings from "./UserSettings";
import ScheduledJobs from "./ScheduledJobs";

import WorkspaceChat from "./WorkspaceChat";
import WorkspaceSettings from "./WorkspaceSettings";
import ConnectToInstance from "./ConnectToInstance";

import DevToolsMenu from "./Dev";

export default {
  OnboardingWelcome,
  OnboardingModelSelection,
  OnboardingSurvey,
  OnboardingDataHandling,
  Home,
  Workspaces,
  Documents,
  Agents,
  Models,
  Search,
  ChatHistory,
  Profile,
  About,

  WorkspaceChat,
  WorkspaceSettings,

  UserSettings,
  ScheduledJobs,
  DevToolsMenu,

  // Connect and Sync
  ConnectToInstance,
};