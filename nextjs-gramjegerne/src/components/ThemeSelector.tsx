"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col items-center p-8">
      <label className="text-lg flex flex-row items-center gap-x-2 text-center">
        Velg tema:
        <select
          value={theme}
          onChange={(e) =>
            setTheme(e.target.value as "green" | "blue" | "yellow")
          }
          className="text-lg form-select bg-dimmed appearance-none pr-8 pl-4 bg-no-repeat"
        >
          <option value="green">Skog</option>
          <option value="blue">Hav</option>
          <option value="yellow">Høst</option>
        </select>
      </label>
    </div>
  );
}
