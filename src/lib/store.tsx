'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppConfig, AppData, Light, LightState, Room, Scene } from './types';
import { SEED } from './seed';
import { applyToDevice } from './control';

const STORAGE_KEY = 'huisverlichting.v1';

interface Store extends AppData {
  ready: boolean;
  error: string | null;
  setLightState: (id: string, patch: Partial<LightState>) => void;
  toggleLight: (id: string) => void;
  toggleRoom: (roomId: string, on: boolean) => void;
  applyScene: (sceneId: string) => void;
  renameLight: (id: string, name: string) => void;
  updateLight: (id: string, patch: Partial<Light>) => void;
  addLight: (light: Light) => void;
  removeLight: (id: string) => void;
  addRoom: (room: Room) => void;
  renameRoom: (id: string, name: string, icon?: string) => void;
  removeRoom: (id: string) => void;
  saveScene: (scene: Scene) => void;
  removeScene: (id: string) => void;
  setConfig: (patch: Partial<AppConfig>) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(SEED);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configRef = useRef<AppConfig>(SEED.config);
  configRef.current = data.config;

  // Laden vanuit localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...SEED, ...JSON.parse(raw) });
    } catch {
      /* negeer */
    }
    setReady(true);
  }, []);

  // Opslaan.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* negeer */
    }
  }, [data, ready]);

  const dispatch = useCallback((light: Light, next: LightState) => {
    applyToDevice(light, next, configRef.current).catch((e) => {
      setError(e?.message || 'Kon apparaat niet bereiken');
      setTimeout(() => setError(null), 4000);
    });
  }, []);

  const setLightState = useCallback(
    (id: string, patch: Partial<LightState>) => {
      setData((d) => {
        const lights = d.lights.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l.state, ...patch };
          dispatch(l, next);
          return { ...l, state: next };
        });
        return { ...d, lights };
      });
    },
    [dispatch],
  );

  const toggleLight = useCallback(
    (id: string) => {
      setData((d) => {
        const lights = d.lights.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l.state, on: !l.state.on };
          dispatch(l, next);
          return { ...l, state: next };
        });
        return { ...d, lights };
      });
    },
    [dispatch],
  );

  const toggleRoom = useCallback(
    (roomId: string, on: boolean) => {
      setData((d) => {
        const lights = d.lights.map((l) => {
          if (l.roomId !== roomId) return l;
          const next = { ...l.state, on };
          dispatch(l, next);
          return { ...l, state: next };
        });
        return { ...d, lights };
      });
    },
    [dispatch],
  );

  const applyScene = useCallback(
    (sceneId: string) => {
      setData((d) => {
        const scene = d.scenes.find((s) => s.id === sceneId);
        if (!scene) return d;
        const lights = d.lights.map((l) => {
          const target = scene.targets[l.id];
          if (!target) return l;
          const next = { ...l.state, ...target };
          dispatch(l, next);
          return { ...l, state: next };
        });
        return { ...d, lights };
      });
    },
    [dispatch],
  );

  const renameLight = useCallback((id: string, name: string) => {
    setData((d) => ({ ...d, lights: d.lights.map((l) => (l.id === id ? { ...l, name } : l)) }));
  }, []);

  const updateLight = useCallback((id: string, patch: Partial<Light>) => {
    setData((d) => ({ ...d, lights: d.lights.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);

  const addLight = useCallback((light: Light) => {
    setData((d) => ({ ...d, lights: [...d.lights, light] }));
  }, []);

  const removeLight = useCallback((id: string) => {
    setData((d) => ({ ...d, lights: d.lights.filter((l) => l.id !== id) }));
  }, []);

  const addRoom = useCallback((r: Room) => setData((d) => ({ ...d, rooms: [...d.rooms, r] })), []);
  const renameRoom = useCallback((id: string, name: string, icon?: string) => {
    setData((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === id ? { ...r, name, icon: icon ?? r.icon } : r)) }));
  }, []);
  const removeRoom = useCallback((id: string) => {
    setData((d) => ({ ...d, rooms: d.rooms.filter((r) => r.id !== id), lights: d.lights.filter((l) => l.roomId !== id) }));
  }, []);

  const saveScene = useCallback((scene: Scene) => {
    setData((d) => {
      const exists = d.scenes.some((s) => s.id === scene.id);
      return { ...d, scenes: exists ? d.scenes.map((s) => (s.id === scene.id ? scene : s)) : [...d.scenes, scene] };
    });
  }, []);
  const removeScene = useCallback((id: string) => setData((d) => ({ ...d, scenes: d.scenes.filter((s) => s.id !== id) })), []);

  const setConfig = useCallback((patch: Partial<AppConfig>) => {
    setData((d) => ({ ...d, config: { ...d.config, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(SEED);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...data,
      ready,
      error,
      setLightState,
      toggleLight,
      toggleRoom,
      applyScene,
      renameLight,
      updateLight,
      addLight,
      removeLight,
      addRoom,
      renameRoom,
      removeRoom,
      saveScene,
      removeScene,
      setConfig,
      resetAll,
    }),
    [data, ready, error, setLightState, toggleLight, toggleRoom, applyScene, renameLight, updateLight, addLight, removeLight, addRoom, renameRoom, removeRoom, saveScene, removeScene, setConfig, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore buiten StoreProvider');
  return ctx;
}
