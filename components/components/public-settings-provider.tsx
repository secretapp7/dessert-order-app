"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import {
  getDefaultPublicBusinessSettings,
  type PublicBusinessSettings,
} from "@/lib/settings/public-settings-types";

const PublicSettingsContext = createContext<PublicBusinessSettings | null>(null);

export function PublicSettingsProvider({
  settings,
  children,
}: {
  settings: PublicBusinessSettings;
  children: ReactNode;
}) {
  return (
    <PublicSettingsContext.Provider value={settings}>{children}</PublicSettingsContext.Provider>
  );
}

export function usePublicBusinessSettings(): PublicBusinessSettings {
  const ctx = useContext(PublicSettingsContext);

  useEffect(() => {
    if (!ctx && process.env.NODE_ENV === "development") {
      console.warn(
        "usePublicBusinessSettings: PublicSettingsProvider not found; using static defaults from config.",
      );
    }
  }, [ctx]);

  return ctx ?? getDefaultPublicBusinessSettings();
}
