import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/initDatabase';
import { WorkspaceProvider } from './src/context/WorkspaceContext';
import { AppPreferencesProvider } from './src/context/AppPreferencesContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error(error);
      } finally {
        setIsReady(true);
      }
    }

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7057F5" />
      </View>
    );
  }

  return (
    <AppPreferencesProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </WorkspaceProvider>
      </ThemeProvider>
    </AppPreferencesProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
});
