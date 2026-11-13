import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, useColorScheme } from "react-native";
import { Uniwind } from "uniwind";
import {
  android,
  hasBluetoothPermission,
  readAndroid,
  Snapshot,
} from "./android";
import { getPalette } from "./theme";

type Theme = "system" | "light" | "dark";
function useAppState() {
  const scheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>("system");
  const [dynamic, setDynamic] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshing = useRef(false);
  const mounted = useRef(true);
  const dark = theme === "dark" || (theme === "system" && scheme === "dark");
  const palette = getPalette(dark, dynamic);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("pod-settings")
      .then((raw) => {
        if (!active || !raw) return;
        const prefs = JSON.parse(raw);
        if (["system", "light", "dark"].includes(prefs.theme))
          setTheme(prefs.theme);
        if (typeof prefs.dynamic === "boolean") setDynamic(prefs.dynamic);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    Uniwind.setTheme(theme);
    if (loaded)
      AsyncStorage.setItem(
        "pod-settings",
        JSON.stringify({ theme, dynamic }),
      ).catch(() => {});
  }, [theme, dynamic, loaded]);
  const refresh = useCallback(async (request = false) => {
    if (refreshing.current && !request) return;
    refreshing.current = true;
    try {
      if (!request && !(await hasBluetoothPermission())) {
        if (mounted.current) setSnapshot(null);
        return;
      }
      const next = await readAndroid(request);
      if (mounted.current) {
        setSnapshot(next);
        if (request) setError(null);
      }
      return next;
    } catch (e) {
      if (mounted.current) {
        setSnapshot(null);
        if (request) setError(message(e));
      }
    } finally {
      refreshing.current = false;
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 1500);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      mounted.current = false;
      clearTimeout(initial);
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);
  const connect = async (id: string) => {
    setError(null);
    try {
      await android?.connectDevice(id);
      await refresh();
    } catch (e) {
      setError(message(e));
    }
  };
  const disconnect = async () => {
    try {
      await android?.disconnectDevice();
      await refresh();
    } catch (e) {
      setError(message(e));
    }
  };
  const bluetoothSettings = async () => {
    try {
      if (!android)
        throw new Error("Install the Android app to connect your AirPods.");
      await android.openBluetoothSettings();
    } catch (e) {
      setError(message(e));
    }
  };
  return {
    theme,
    setTheme,
    dynamic,
    setDynamic,
    dark,
    palette,
    snapshot,
    refresh,
    connect,
    disconnect,
    bluetoothSettings,
    error,
    setError,
  };
}
export function message(e: unknown) {
  return e instanceof Error
    ? e.message.replace(/^.*?: /, "")
    : "Something went wrong. Please try again.";
}
const Context = createContext<ReturnType<typeof useAppState> | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={useAppState()}>{children}</Context.Provider>;
}
export function usePods() {
  const state = useContext(Context);
  if (!state) throw new Error("AppProvider is missing");
  return state;
}
