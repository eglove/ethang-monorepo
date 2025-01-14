import cspell from "@cspell/eslint-plugin";
import { CustomRules, genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = Object.keys(getNonDeprecatedRules(cspell.rules));

const customRules: CustomRules = [
  {
    name: "spellchecker",
    rule: [
      "error",
      {
        cspell: {
          words: [
            "typicode",
            "toolbelt",
            "taze",
            "ethang",
            "TSESTree",
            "Boop",
            "cldr",
            "astro",
            "laravel",
            "qwik",
            "sitecore",
            "uswds",
            "mediat",
            "Packt",
            "Academind",
            "Udemy",
            "Colte",
            "Bootcamp",
            "HTMX",
            "MERN",
            "Nuxt",
            "Credly",
            "Sterett",
            "Beyonder",
            "hotspot",
            "lqip",
            "Hawn",
            "nextui",
            "speculationrules",
            "zustand",
            "vinxi",
            "datasource",
            "turso",
            "supabase",
            "solidjs",
            "labelledby",
            "svix",
            "blockqoute",
            "cortexjs",
            "mathrm",
            "nums",
            "lifecycles",
            "krausest",
            "Signalis",
            "Plass",
            "Iteree",
            "Sonner",
            "cmdk",
            "ngsw",
            "dexie",
            "leetcode",
          ],
        },
      },
    ],
  },
];

export const cspellRules = genRules(ruleNames, customRules, "cspell");
