import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAllChannels } from '../database/repositories/channelRepository';
import {
  getSelectedWorkspaceChannelId,
  saveSelectedWorkspaceChannelId,
} from '../database/repositories/settingsRepository';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState({ channelId: null, channels: [], ready: false });
  const workspaceRef = useRef(workspace);

  const updateWorkspace = useCallback((nextWorkspace) => {
    workspaceRef.current = nextWorkspace;
    setWorkspace(nextWorkspace);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const [channels, savedChannelId] = await Promise.all([
      getAllChannels(),
      getSelectedWorkspaceChannelId(),
    ]);
    const channelId = savedChannelId !== null && channels.some((channel) => channel.id === savedChannelId)
      ? savedChannelId
      : null;
    if (channelId !== savedChannelId) await saveSelectedWorkspaceChannelId(channelId);
    updateWorkspace({ channelId, channels, ready: true });
    return { channelId, channels };
  }, [updateWorkspace]);

  useEffect(() => {
    let active = true;
    Promise.all([getAllChannels(), getSelectedWorkspaceChannelId()])
      .then(async ([channels, savedChannelId]) => {
        if (!active) return;
        const channelId = savedChannelId !== null && channels.some((channel) => channel.id === savedChannelId)
          ? savedChannelId
          : null;
        if (channelId !== savedChannelId) await saveSelectedWorkspaceChannelId(channelId);
        if (active) updateWorkspace({ channelId, channels, ready: true });
      })
      .catch((error) => {
        console.error('Workspace loading error:', error);
        if (active) updateWorkspace({ ...workspaceRef.current, ready: true });
      });
    return () => { active = false; };
  }, [updateWorkspace]);

  const selectWorkspace = useCallback(async (channelId) => {
    const channels = await getAllChannels();
    const normalizedId = channelId === null ? null : Number(channelId);
    if (normalizedId !== null && !channels.some((channel) => channel.id === normalizedId)) {
      throw new Error('That channel is no longer available. Choose another channel.');
    }
    await saveSelectedWorkspaceChannelId(normalizedId);
    updateWorkspace({ channelId: normalizedId, channels, ready: true });
  }, [updateWorkspace]);

  const value = useMemo(() => ({
    ...workspace,
    selectedChannel: workspace.channels.find((channel) => channel.id === workspace.channelId) || null,
    selectWorkspace,
    refreshWorkspace,
  }), [workspace, selectWorkspace, refreshWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider.');
  return context;
}
