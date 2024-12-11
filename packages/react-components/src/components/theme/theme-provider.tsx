import constant from "lodash/constant.js";
import isNil from "lodash/isNil";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProperties = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

const initialState: ThemeProviderState = {
  setTheme: constant(null),
  theme: "system",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...properties
}: Readonly<ThemeProviderProperties>) => {
  const [theme, setTheme] = useState<Theme>(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unnecessary-condition,n/no-unsupported-features/node-builtins
      return (globalThis.localStorage.getItem(storageKey) as Theme) ??
        defaultTheme;
    },
  );

  useEffect(() => {
    const root = globalThis.document.documentElement;

    root.classList.remove("light", "dark");

    if ("system" === theme) {
      const systemTheme = globalThis.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = useMemo(() => {
    return {
      setTheme: (_theme: Theme) => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        globalThis.localStorage.setItem(storageKey, _theme);
        setTheme(_theme);
      },
      theme,
    };
  }, [storageKey, theme]);

  return (
    <ThemeProviderContext
      {...properties}
      value={value}
    >
      {children}
    </ThemeProviderContext>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (isNil(context)) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
