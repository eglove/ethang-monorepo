export const sortAlphabetically = (a: string, b: string) => {
  return a.localeCompare(b);
};

export const projectList = [
  {
    code: "https://github.com/eglove/ethang-monorepo/tree/master/packages/eslint-config",
    description: "Extreme level ESLint config, updated almost daily.",
    tech: ["ESLint", "Prettier", "TypeScript"].sort(sortAlphabetically),
    title: "@ethang/eslint-config",
  },
  {
    code: "https://github.com/eglove/ethang-monorepo/tree/master/apps",
    description:
      "Personal dashboard for tracking todos, bookmarks and job applications.",
    tech: [
      "Cloudflare Worker",
      "Cloudflare D1",
      "Clerk",
      "Cortex Compute Engine",
      "Zod",
      "HeroUI",
      "Prisma",
      "TanStack Query",
      "TanStack Router",
      "IndexedDB",
      "React",
      "ReCharts",
      "Tailwind",
      "Vite PWA",
      "TypeScript",
    ].sort(sortAlphabetically),
    title: "Dashboard",
  },
  {
    code: "https://github.com/eglove/ethang-monorepo/tree/master/apps/sterett-react",
    description: "Homepage for Sterett Creek Village Trustee Board",
    publicUrl: "https://sterettcreekvillagetrustee.com/",
    tech: [
      "React",
      "HeroUI",
      "Sanity",
      "TanStack Query",
      "TanStack Router",
      "Tailwind",
      "Vite PWA",
      "TypeScript",
    ].sort(sortAlphabetically),
    title: "Sterett Creek Village Trustee",
  },
];
