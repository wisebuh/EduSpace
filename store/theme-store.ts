import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";
export type AccentColor = "blue" | "emerald" | "purple" | "amber";

interface ThemeState {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccentColor: (accent: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      accentColor: "blue",

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),

      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: "eduspace-theme",
    }
  )
);