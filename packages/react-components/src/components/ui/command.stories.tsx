import {
  Command,
  CommandEmpty, CommandGroup,
  CommandInput, CommandItem,
  CommandList, CommandShortcut,
} from "@/components/ui/command.tsx";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";

export default {
  title: "ui/command",
};

export const Default = () => {
  return (
    <Command className="rounded-lg border shadow-md md:min-w-96">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>
              Calendar
            </span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>
              Search Emoji
            </span>
          </CommandItem>
          <CommandItem disabled>
            <Calculator />
            <span>
              Calculator
            </span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings" >
          <CommandItem>
            <User />
            <span>
              Profile
            </span>
            <CommandShortcut>
              ⌘P
            </CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>
              Billing
            </span>
            <CommandShortcut>
              ⌘B
            </CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>
              Settings
            </span>
            <CommandShortcut>
              ⌘S
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};