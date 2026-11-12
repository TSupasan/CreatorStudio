import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../screens/DashboardScreen';
import WorkspaceHomeScreen from '../screens/WorkspaceHomeScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import VideosScreen from '../screens/VideosScreen';
import CreateVideoScreen from '../screens/CreateVideoScreen';
import VideoDetailsScreen from '../screens/VideoDetailsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import BackupRestoreScreen from '../screens/BackupRestoreScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ThemeSelectionScreen from '../screens/ThemeSelectionScreen';
import IdeaVaultScreen from '../screens/IdeaVaultScreen';
import IdeaEditorScreen from '../screens/IdeaEditorScreen';

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function HomeFlow() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="WorkspaceHome" component={WorkspaceHomeScreen} />
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeFlow} />
      <Tab.Screen name="Video" component={VideosScreen} />
      <Tab.Screen name="Create" component={CreateVideoScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Idea" component={IdeaVaultScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />

      <Stack.Screen
        name="VideoDetails"
        component={VideoDetailsScreen}
      />

      <Stack.Screen
        name="EditVideo"
        component={CreateVideoScreen}
      />

      <Stack.Screen
        name="BackupRestore"
        component={BackupRestoreScreen}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <Stack.Screen
        name="ThemeSelection"
        component={ThemeSelectionScreen}
      />

      <Stack.Screen
        name="ManageChannels"
        component={ChannelsScreen}
      />

      <Stack.Screen
        name="IdeaEditor"
        component={IdeaEditorScreen}
      />
    </Stack.Navigator>
  );
}
