"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as "green" | "blue")}
      className="menu-item text-lg appearance-none block w-full flex text-center"
    >
      <option value="green">Skog</option>
      <option value="blue">Hav</option>
    </select>
  );
}
