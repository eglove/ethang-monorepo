import { atddFsmTdd } from "./atdd-fsm-tdd.ts";
import { commit } from "./commit.ts";
import { lint } from "./lint.ts";

export const GLOBAL_COMMANDS = [atddFsmTdd, commit, lint] as const;
