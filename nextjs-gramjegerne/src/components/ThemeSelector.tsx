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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="menu-theme text-lg focus:outine-none focus:border-1 focus:stroke-0 focus:outline-0 border-fg-dimmed border-1 rounded-md flex items-center justify-center gap-x-2">
        <Icon
          width={24}
          height={24}
          name={themes.find((t) => t.value === theme)?.icon ?? "tree"}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="flex flex-col bg-dimmed border-0"
      >
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="text-lg gap-x-1"
          >
            <Icon name={t.icon} />
            {t.label}
            {theme === t.value}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
