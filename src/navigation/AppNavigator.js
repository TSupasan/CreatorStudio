
import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from '../screens/DashboardScreen';
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
        animation: 'fade',
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="Videos"
        children={() => (
          <ComingSoonScreen
            title="My Videos"
            icon="videocam-outline"
          />
        )}
      />

      <Tab.Screen
        name="Create"
        children={() => (
          <ComingSoonScreen
            title="Create Project"
            icon="add-circle-outline"
          />
        )}
      />

      <Tab.Screen
        name="Calendar"
        children={() => (
          <ComingSoonScreen
            title="Upload Calendar"
            icon="calendar-outline"
          />
        )}
      />

      <Tab.Screen
        name="Channels"
        children={() => (
          <ComingSoonScreen
            title="My Channels"
            icon="people-outline"
          />
        )}
      />
    </Tab.Navigator>
  );
}
