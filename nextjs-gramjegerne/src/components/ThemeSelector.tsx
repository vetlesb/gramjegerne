"use client";

import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Icon from "@/components/Icon";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "green", label: "Skog", icon: "tree" },
    { value: "blue", label: "Hav", icon: "water" },
    { value: "yellow", label: "Høst", icon: "leaf" },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="menu-theme text-lg border-0 outline-none focus:outline-none rounded-md flex items-center justify-center gap-x-1 md:w-28">
        <Icon width={24} height={24} name={currentTheme?.icon ?? "tree"} />
        <span>{currentTheme?.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="flex flex-col bg-primary gap-y-2 mt-3 p-4 bg-dimmed border-0"
      >
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="text-lg gap-x-1"
          >
            <Icon name={t.icon} width={24} height={24} />
            {t.label}
            {theme === t.value}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
