export const home = {
  CLIENT_PROJECTS: {
    AUTOMATED_TESTING: {
      DETAIL:
        "Introduced end-to-end and component tests. React state bugs that hid from manual review surfaced in the first week.",
      NAME: "Automated testing for a legacy .NET + React codebase",
      UNSTICK: "Surfaced React state bugs that had resisted manual review."
    },
    COLLABORATION_APP: {
      DETAIL:
        "Built a team collaboration app from scratch: P2P video, chat, phone, calendar, file sharing, websocket notifications. Solo, idea to working product.",
      NAME: "Team collaboration app: video, chat, calendar, files"
    },
    CRYPTO_DASHBOARD: {
      DETAIL:
        "Consulted on a real-time crypto pricing dashboard. Performance budgeted and met.",
      NAME: "Real-time crypto pricing dashboard"
    },
    FARMING_DASHBOARD: {
      DETAIL:
        "Built features for a highly dynamic international farming dashboard. Used Redux time-travel debugging to understand existing state, then extend it.",
      NAME: "Farming dashboard with Redux time-travel"
    },
    FEDERAL_EMISSIONS: {
      DETAIL:
        "One of three developers on the rewrite. Test coverage climbed until QA asked us to slow down; used the runway for better repros.",
      NAME: "Rebuild of a federal emissions monitoring system",
      UNSTICK:
        "Shipped faster than QA could keep up; used the runway for more reproducible bug reports."
    },
    IE11_DASHBOARD: {
      DETAIL:
        "Redesigned a customer dashboard in vanilla JS. Kept compatibility with Internet Explorer 11.",
      NAME: "Customer dashboard redesign (IE11)"
    },
    LOW_CODE_GRAPHQL: {
      DETAIL:
        "Worked on a low-code platform that generated GraphQL APIs through a React UI.",
      NAME: "Low-code GraphQL platform"
    },
    NEXT_JS_MIGRATION: {
      DETAIL:
        "Upgraded a vanilla React + Sitecore app to Next.js. The migration had been stalled for two months on hosting; shipped in a few weeks, then redesigned the user dashboard.",
      NAME: "Next.js migration off a legacy CMS",
      UNSTICK:
        "Unstuck a Next.js migration that had been stalled for two months on hosting."
    },
    NONPROFIT_SEO: {
      DETAIL:
        "SEO and performance consulting for a non-profit working to end dog homelessness, plus two national radio stations.",
      NAME: "Non-profit and radio SEO consulting"
    },
    REACT_NATIVE_ERP: {
      DETAIL:
        "Built a React Native ERP for a small local business. Greenfield app, then iterated with the owner.",
      NAME: "React Native ERP for a local small business"
    },
    SHIPPING_QUOTES: {
      DETAIL:
        "Delivered a quotes-and-booking app integrating FedEx, UPS, and other carriers.",
      NAME: "Multi-carrier shipping quotes and booking"
    },
    TELECOM: {
      DETAIL:
        "Built and maintained responsive web applications and RESTful web services for telecom members to manage user access to internet, telephone, and TV/streaming services. Java microservices with Spring Boot.",
      NAME: "Telecom provisioning platform"
    },
    VILLAGE_TRUSTEE: {
      DETAIL:
        "Built and maintained a CMS-driven React site for a village trustee board.",
      NAME: "CMS-driven village trustee site"
    }
  },
  CLIENT_WORK: "Client work",
  MONOREPO: "Monorepo",
  MONOREPO_PROJECTS: {
    AGENTS_BUILD: {
      DETAIL:
        "TypeScript-defined skills, rules, and commands compiled into a checked-in .agents/ directory with sizing and drift checks. The compiler behind the skills used in this monorepo.",
      NAME: "Agent skills compiler (agents-build)"
    },
    AUTH_SERVICE: {
      DETAIL:
        "Cloudflare Workers, Hono, Drizzle ORM, D1. Authentication service used across the monorepo.",
      NAME: "Authentication service (auth)"
    },
    COURSE_TRACKING: {
      DETAIL:
        "Cloudflare Workers RPC and Drizzle. Course tracking with structured lessons and progress.",
      NAME: "Course tracking (ethang-courses)"
    },
    HOME_PAGE: {
      DETAIL:
        "Astro, content collections, Tailwind CSS, and Cloudflare Workers. The page you are reading, built from the monorepo's shared content and services.",
      NAME: "This home page (ethang-astro)"
    },
    RSS_PIPELINE: {
      DETAIL:
        "Ingest feeds, dedupe, normalize, publish. Runs on the same worker stack as the rest of the monorepo.",
      NAME: "RSS pipeline (ethang-rss)"
    }
  },
  WHAT_IVE_SHIPPED_HEADING: "What I\u{2019}ve shipped"
} as const;
