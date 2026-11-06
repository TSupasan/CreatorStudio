
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../screens/DashboardScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import VideosScreen from '../screens/VideosScreen';
import CreateVideoScreen from '../screens/CreateVideoScreen';

import CustomTabBar from './CustomTabBar';
import ComingSoonScreen from '../components/ComingSoonScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
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

      <Tab.Screen
        name="Calendar"
        children={() => (
          <ComingSoonScreen
            title="Upload Calendar"
            icon="calendar-outline"
          />
        )}
      />

      <Tab.Screen name="Channels" component={ChannelsScreen} />
    </Tab.Navigator>
  );
}
