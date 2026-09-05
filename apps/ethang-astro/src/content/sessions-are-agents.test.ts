import map from "lodash/map.js";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL("blog/sessions-are-agents/index.mdx", import.meta.url);

const postDate = "2026-09-05T12:00:00Z";

const imagePaths = {
  spawnTree: new URL(
    "blog/sessions-are-agents/images/spawn-tree.svg",
    import.meta.url
  ),
  steeringMap: new URL(
    "blog/sessions-are-agents/images/steering-map.svg",
    import.meta.url
  ),
  watchdogLadder: new URL(
    "blog/sessions-are-agents/images/watchdog-ladder.svg",
    import.meta.url
  )
};

const requiredSnippets = [
  // Intro
  "the scaffolding an AI model acts through",
  "[eThang Agent](https://github.com/eglove/ethang-agent)",
  "spawn tree",
  "persisted spawn contracts",

  // 1. Sessions are agents
  "depth-0",
  "AgentRecord",
  "ParentId",
  "records are born un-attempted",
  "resume and audit see the contract the run started with",
  "self-describing",

  // 2. Ten actions, one capability
  '"notify-subtree", "notify-ancestors"',
  "id=<id> status=running",
  "Error [InvalidSpawnRequest]",
  "Error [DepthExceeded]",
  "Error [MissingModel]",
  "Error [ConcurrencyCapReached]",
  "self-correct",

  // 3. The spawn contract
  "SpawnContract",
  "ResultSchema",
  '{"tool.allow": "read; exec", "tool.deny": "web_fetch"}',
  "BudgetCeilings",
  "MaxUrgency",
  "PreemptGrant",
  "EffectiveTools",

  // 4. Privilege cannot grow down the tree
  "privilege cannot grow down the tree",
  "widening fails the spawn",
  "NonEmptyTaskPromptSpecification",
  "ValidModelReferenceSpecification",
  "FilteredToolRegistry",
  "FilteredCapabilityRegistry",
  "GrantViolation",
  "IModelSelector",

  // 5. Spawn returns immediately
  "priority-then-FIFO",
  "WhenSettledAsync",
  "status is a projection for humans, not a poll target",
  "agent.wait",

  // 6. How a child runs
  "SubAgentSpawner",
  "IAgentRunner",
  "model catalog",
  "ChildMaxTokens = 32 * 1024",
  "ChildTemperature = 0.7f",
  "ContextAccountant",
  "two children must never share totals",
  "RunningChild",
  "AsyncLocal",
  "one repair round",
  "Error [InvalidResult]",
  "ReportOverflowAnnotation",

  // 7. Children never talk to humans
  "HumanFacingActions",
  "a machine-owned child must neither wait on nor interrupt the user",

  // 8. Steering with mailboxes
  "bounded",
  "IMailboxStore",
  "safe points",
  "never between a tool call and its results",
  "Error [MailboxFull]",
  "Error [NotRunning]",
  "Error [UrgencyNotGranted]",
  "Normal, Attention, Urgent",
  "MailboxDrainedEvent",

  // 9. Preemption, consent-gated
  "preemption",
  "turn repair",

  // 10. Broadcasts up and down the tree
  "BFS",
  "hop=1",
  "reached=4",

  // 11. Links: leaving the tree
  "AgentLinkRegistry",
  "agent.route",
  "consented",
  "revocable",
  "agent_links",
  "isolation by default",
  "RemoteMailboxProxy",

  // 12. Three ways to die, no clocks
  "ChildTimeout was deleted",
  "wall-clock is never a cancellation source",
  "budget hard ceiling",
  "InterruptSubtree",
  "deepest-first",

  // 13. Supervision: facts, not guesses
  "ChildSupervisor",
  "ChildSupervisorRegistry",
  "SupervisorFeed",
  "idle alerts never feed",
  "self-deadlock",

  // 14. The watchdog
  "WatchdogPolicy",
  "AgentWatchdog",
  "Decide(isChild, idleAge, wrapUpAttempts)",
  "15-minute idle",
  "60-second settle",
  "wrap-up attempt",
  "wrap-up nudge",
  "[watchdog] You showed no activity",
  "same-id retry",
  "Failed(Hung)",
  "watchdog_events",
  "WatchdogErrored",
  "WatchdogLoop",
  "HostChildWatchdog",
  "never guesses from absent beats",

  // 15. Fan-out, fanned in
  "agent.fanout",
  "SpawnGraphHandler",
  "no new runtime machinery",
  "member receipts",
  "FAILED(reason)",

  // 16. Children that outlive the app
  "ChildHost",
  "named pipe",
  "RemoteAgentRuntime",
  "at-least-once",
  "declared live set",
  "orphan repair",
  "Failed(Interrupted)",
  "TLA+",

  // 17. Configuration that refuses to guess
  "SubAgent:MaxConcurrentAgents",
  "SubAgent:RemoteHost",
  "SubAgent:Watchdog",
  "parse them as days",
  "children inherit the host's root model",

  // Closing
  "push-not-poll",
  "Strict correctness at the boundaries",
  "mirror-image"
] as const;

const requiredImageSnippets = [
  "featuredImage: ./images/spawn-tree.svg",
  'src="/images/blog/sessions-are-agents/spawn-tree.svg"',
  'src="/images/blog/sessions-are-agents/steering-map.svg"',
  'src="/images/blog/sessions-are-agents/watchdog-ladder.svg"',
  'alt="Diagram of the eThang Agent spawn tree: a root session at depth zero, children at depth one, and a grandchild at depth two, with the effective tool set narrowing at every level down to the depth limit"',
  'alt="Diagram of steering in the eThang Agent subagent system: mailbox delivery with urgency levels and preemption, subtree and ancestor broadcasts with per-hop receipts, and a consented link carrying a routed message outside the spawn tree"',
  'alt="Diagram of the watchdog ladder in eThang Agent: idle detection escalates from watching to an interrupt, a same-id retry with a wrap-up nudge, and a final Failed(Hung) verdict, with only three cancellation sources"',
  "The spawn tree: each spawn may only narrow the effective tool set, and depth is capped.",
  "Steering a running child: mailboxes for direct sends, broadcasts up and down the tree, and consented links for leaving it entirely.",
  "The watchdog ladder: interrupt, give the child one chance to wrap up on its own terms, then fail it with the truth."
] as const;

describe("Sessions Are Agents: The eThang Agent Subagent System", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "sessions-are-agents"');
    expect(post).toContain(
      'title: "Sessions Are Agents: The eThang Agent Subagent System"'
    );
    expect(post).toContain('blogCategory: "Engineering"');
    expect(post).toContain(`pubDate: "${postDate}"`);
    expect(post).toContain(`updatedDate: "${postDate}"`);
    expect(post).toContain("featuredImage: ./images/spawn-tree.svg");
    expect(post).toContain(
      'description: "One idea — the root session is itself an agent record — grows into eThang Agent\'s whole subagent system: persisted spawn contracts, privilege that cannot grow down the tree, steering mailboxes, a watchdog with no wall-clock timeouts, fan-out graphs, and children that outlive the app."'
    );
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it.each(requiredImageSnippets)("embeds the diagram %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("ships the diagrams as complete, accessible SVGs", async () => {
    const [spawnTree, steeringMap, watchdogLadder] = await Promise.all([
      readFile(imagePaths.spawnTree, "utf8"),
      readFile(imagePaths.steeringMap, "utf8"),
      readFile(imagePaths.watchdogLadder, "utf8")
    ]);

    for (const svg of [spawnTree, steeringMap, watchdogLadder]) {
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("<title id=");
      expect(svg).toContain("<desc id=");
      expect(svg).toContain('role="img"');
    }
  });

  it("keeps the public copies byte-identical to the source diagrams", async () => {
    const diagrams = [
      ["spawn-tree.svg", imagePaths.spawnTree],
      ["steering-map.svg", imagePaths.steeringMap],
      ["watchdog-ladder.svg", imagePaths.watchdogLadder]
    ] as const;

    const [sources, published] = await Promise.all([
      Promise.all(
        map(diagrams, async ([, sourcePath]) => {
          return readFile(sourcePath, "utf8");
        })
      ),
      Promise.all(
        map(diagrams, async ([name]) => {
          return readFile(
            new URL(
              `../../public/images/blog/sessions-are-agents/${name}`,
              import.meta.url
            ),
            "utf8"
          );
        })
      )
    ]);

    expect(published).toEqual(sources);
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
  });
});
