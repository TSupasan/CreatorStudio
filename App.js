import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/initDatabase';
import { WorkspaceProvider } from './src/context/WorkspaceContext';
import { AppPreferencesProvider } from './src/context/AppPreferencesContext';
import PreparingWorkspaceScreen from './src/components/PreparingWorkspaceScreen';

function AppBootstrap() {
  const [databaseState, setDatabaseState] = useState('loading');
  const [databaseError, setDatabaseError] = useState(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function prepareApp() {
      setDatabaseState('loading');
      setDatabaseError(null);
      try {
        await initializeDatabase();
        if (isActive) setDatabaseState('ready');
      } catch (error) {
        console.error('CreatorStudio could not initialize its local database:', error);
        if (isActive) {
          setDatabaseError(error instanceof Error ? error : new Error(String(error || 'Unknown database initialization error.')));
          setDatabaseState('error');
        }
      }
    }

    prepareApp();
    return () => { isActive = false; };
  }, [initializationAttempt]);

  if (databaseState !== 'ready') {
    return (
      <PreparingWorkspaceScreen
        error={databaseState === 'error' ? databaseError : null}
        onRetry={() => setInitializationAttempt((attempt) => attempt + 1)}
      />
    );
  }

  return <WorkspaceProvider><NavigationContainer><AppNavigator /></NavigationContainer></WorkspaceProvider>;
}

export default function App() {
  return <AppPreferencesProvider><ThemeProvider><AppBootstrap /></ThemeProvider></AppPreferencesProvider>;
}
