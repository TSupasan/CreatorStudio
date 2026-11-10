import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../screens/DashboardScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import VideosScreen from '../screens/VideosScreen';
import CreateVideoScreen from '../screens/CreateVideoScreen';
import VideoDetailsScreen from '../screens/VideoDetailsScreen';
import CalendarScreen from '../screens/CalendarScreen';

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Videos" component={VideosScreen} />
      <Tab.Screen name="Create" component={CreateVideoScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Channels" component={ChannelsScreen} />
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
    </Stack.Navigator>
  );
}
