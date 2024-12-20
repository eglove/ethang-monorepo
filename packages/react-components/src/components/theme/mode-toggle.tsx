import { Moon, Sun } from "lucide-react";

import { Button } from "../ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { useTheme } from "./theme-provider.tsx";

export const ModeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="size-8"
          size="icon"
          variant="ghost"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">
            Toggle theme
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={
          () => {
            setTheme("light");
          }
        }
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={
          () => {
            setTheme("dark");
          }
        }
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={
          () => {
            setTheme("system");
          }
        }
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
