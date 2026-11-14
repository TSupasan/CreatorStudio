import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultAppPreferences, getAppPreferences, saveAppPreferences } from '../database/repositories/settingsRepository';

const AppPreferencesContext = createContext(null);

export function AppPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getAppPreferences()
      .then((saved) => { if (active) setPreferences(saved); })
      .catch((error) => console.warn('Could not load app preferences:', error))
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const updatePreferences = useCallback(async (changes) => {
    const next = await saveAppPreferences({ ...preferences, ...changes });
    setPreferences(next);
    return next;
  }, [preferences]);

  const refreshPreferences = useCallback(async () => {
    const saved = await getAppPreferences();
    setPreferences(saved);
    return saved;
  }, []);

  const value = useMemo(() => ({ preferences, ready, updatePreferences, refreshPreferences }), [preferences, ready, updatePreferences, refreshPreferences]);
  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('useAppPreferences must be used inside AppPreferencesProvider.');
  return context;
}
