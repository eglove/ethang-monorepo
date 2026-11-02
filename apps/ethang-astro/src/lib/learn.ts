/*
 * The Learn curriculum: the ten stages of "Courses for people who use AI to
 * write software", carried as data so the page renders structure rather than
 * prose. Every stage mixes registers on purpose, so an entry records its
 * marker (how it is consumed) alongside what it teaches.
 *
 * The list's own rule is why it is shaped this way: anything the model
 * produces on demand is a prompt, not a course. A course earns its place by
 * teaching a judgment the model cannot supply, or a check it cannot fake.
 * Every stage therefore ends in a prove-it check rather than a reading list.
 */

import filter from "lodash/filter.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import padStart from "lodash/padStart.js";
import reduce from "lodash/reduce.js";

/*
 * How an entry is consumed. Format, not difficulty: several `video` entries
 * are harder than several `book` ones.
 */
const HILLEL_WAYNE = "Hillel Wayne";

export const LEARN_MARKERS = [
  "video",
  "course",
  "book",
  "lab",
  "paper",
  "corpus"
] as const;

export type LearnMarker = (typeof LEARN_MARKERS)[number];

/*
The register each marker arrives in, in the list's own words.
*/
export const MARKER_REGISTERS: Readonly<Record<LearnMarker, string>> = {
  book: "Read, with a voice rather than a specification.",
  corpus: "Worked examples to read rather than a thing to study.",
  course: "Structured series with exercises, longer commitment.",
  lab: "Interactive, you break something on purpose.",
  paper: "Primary source, dense, worth the effort.",
  video:
    "Watch and follow along. Short episodes, high production, low friction."
};

/*
 * Badge classes are complete Tailwind literals, never assembled from
 * fragments, so the v4 source scanner still emits every utility.
 */
const MARKER_BADGE_CLASSES: Readonly<Record<LearnMarker, string>> = {
  book: "border-night-owl-purple/40 bg-night-owl-purple/10 text-night-owl-purple",
  corpus:
    "border-night-owl-orange/40 bg-night-owl-orange/10 text-night-owl-orange",
  course: "border-primary/40 bg-primary/10 text-primary",
  lab: "border-success/40 bg-success/10 text-success",
  paper: "border-warning/40 bg-warning/10 text-warning",
  video: "border-secondary/40 bg-secondary/10 text-secondary"
};

export type LearnEntry = {
  /*
  Stage numbers this entry is also filed under, for cross-references.
  */
  readonly alsoIn?: readonly number[];
  readonly by?: string;
  readonly marker: LearnMarker;
  readonly note: string;
  readonly title: string;
  readonly url?: string;
};

export type LearnGroup = {
  readonly blurb?: string;
  readonly entries: readonly LearnEntry[];
  readonly heading?: string;
};

export type LearnStage = {
  /*
  How a reader knows the stage landed.
  */
  readonly doneWhen: string;
  readonly groups: readonly LearnGroup[];
  readonly lede: string;
  readonly number: number;
  /*
  Which entry to pair with this stage's core, and why.
  */
  readonly pairWith: string;
  readonly slug: string;
  readonly title: string;
};

const markerSet: ReadonlySet<string> = new Set(LEARN_MARKERS);

export const isLearnMarker = (value: unknown): value is LearnMarker => {
  return isString(value) && markerSet.has(value);
};

export const markerLabel = (marker: LearnMarker) => {
  return marker.charAt(0).toUpperCase() + marker.slice(1);
};

export const markerBadgeClass = (marker: LearnMarker) => {
  return MARKER_BADGE_CLASSES[marker];
};

const PAD_WIDTH = 2;

export const formatStageNumber = (value: number) => {
  return padStart(String(value), PAD_WIDTH, "0");
};

export const entryCountLabel = (count: number) => {
  return `${count} ${1 === count ? "entry" : "entries"}`;
};

export const stageEntries = (stage: Pick<LearnStage, "groups">) => {
  return stage.groups.flatMap((group) => {
    return group.entries;
  });
};

/*
 * Every marker is listed here so the compiler enforces exhaustiveness: adding a
 * register to LEARN_MARKERS fails this object until it is given a zero, which
 * is cheaper than discovering the omission in a count that silently misses it.
 */
const EMPTY_COUNTS: Readonly<Record<LearnMarker, number>> = {
  book: 0,
  corpus: 0,
  course: 0,
  lab: 0,
  paper: 0,
  video: 0
};

export const countEntriesByMarker = (
  entries: readonly Pick<LearnEntry, "marker">[]
) => {
  const counts: Record<LearnMarker, number> = { ...EMPTY_COUNTS };
  for (const entry of entries) {
    counts[entry.marker] += 1;
  }
  return counts;
};

export const totalEntryCount = (
  stages: readonly Pick<LearnStage, "groups">[]
) => {
  return reduce(
    stages,
    (total, stage) => {
      return total + stageEntries(stage).length;
    },
    0
  );
};

/*
 * The markers a stage uses, with how many of each, in register order. Returned
 * as data rather than a formatted string so the page can render each as an icon.
 */
export const stageMarkerSummary = (stage: Pick<LearnStage, "groups">) => {
  const counts = countEntriesByMarker(stageEntries(stage));
  return map(
    filter(LEARN_MARKERS, (marker) => {
      return 0 < counts[marker];
    }),
    (marker) => {
      return { count: counts[marker], marker };
    }
  );
};

export const stageBySlug = (slug: string) => {
  return learnStages.find((stage) => {
    return stage.slug === slug;
  });
};

export const learnStages: readonly LearnStage[] = [
  {
    doneWhen:
      "You can start a project, commit, run it, break it, and read the error without leaving the shell.",
    groups: [
      {
        entries: [
          {
            by: "MIT",
            marker: "video",
            note: "Shell, editors, version control, debugging, profiling. Taught as a series of live sessions, and the single best hour-to-value ratio on this list.",
            title: "The Missing Semester of Your CS Education",
            url: "https://missing.csail.mit.edu/"
          },
          {
            by: "Ben Eater",
            marker: "video",
            note: "Build a working computer on breadboards, one episode at a time. The friendliest possible route into what a clock and a register actually are.",
            title: "8-bit computer",
            url: "https://eater.net/8bit"
          },
          {
            marker: "video",
            note: "Forty short animated episodes. Watch it before the serious books and the vocabulary stops being a wall.",
            title: "Crash Course Computer Science",
            url: "https://thecrashcourse.com/topic/computerscience/"
          }
        ]
      },
      {
        blurb:
          "Will Sentance's complete set, all in one register: a lecture where someone reasons in front of you, builds the mental model on a whiteboard, and drills it until it holds. Watch them in sequence rather than cherry-picking, because each one assumes the model the last one built.",
        entries: [
          {
            marker: "course",
            note: "Closures, async, OOP, and metaprogramming as a model of execution rather than a set of tricks.",
            // eslint-disable-next-line no-script-url -- the course title starts with "JavaScript:", which the rule reads as a javascript: URI.
            title: "JavaScript: The Hard Parts, v3",
            url: "https://master.dev/courses/javascript-hard-parts-v3/"
          },
          {
            marker: "course",
            note: "Prototypal design, and how it enables ES6 classes under the hood.",
            title: "The Hard Parts of Object Oriented JavaScript",
            url: "https://master.dev/courses/object-oriented-js/"
          },
          {
            marker: "course",
            note: "Higher-order functions, composition, pure functions, and immutability.",
            title: "The Hard Parts of Functional JavaScript",
            url: "https://master.dev/courses/functional-js-fundamentals/"
          },
          {
            marker: "course",
            note: "Promises and async/await from the call stack, event loop, callback queue, and micro-task queue.",
            title: "The Hard Parts of Asynchronous JavaScript",
            url: "https://master.dev/courses/javascript-new-hard-parts/"
          },
          {
            marker: "course",
            note: "HTTP, TCP/IP, and ports from first principles, then the event loop, streams, and buffers.",
            title: "The Hard Parts of Servers and Node.js",
            url: "https://master.dev/courses/servers-node-js/"
          },
          {
            marker: "course",
            note: "Data binding, templating, virtual DOM and reconciliation, and hooks, all built from scratch. The clearest account of what React is actually doing.",
            title: "The Hard Parts of UI Development",
            url: "https://master.dev/courses/hard-parts-ui-dev/"
          },
          {
            alsoIn: [8],
            marker: "course",
            note: "Prediction and training from a basic decision model up to a neural network, with fraud detection and image recognition as the worked examples. Filed with stage 8's material too, but it belongs in this sequence.",
            title: "The Hard Parts of Neural Networks",
            url: "https://master.dev/courses/hard-parts-ai/"
          }
        ],
        heading: "The Hard Parts, in full"
      }
    ],
    lede: "The unglamorous prerequisites that make everything after it cheap. Do this first and the rest of the list takes half the time.",
    number: 1,
    pairWith:
      "Watch the Hard Parts series in sequence, because each one assumes the model the last one built. Take Missing Semester first if the shell is still unfamiliar.",
    slug: "fluency",
    title: "Fluency"
  },
  {
    doneWhen:
      "From reading one line, you can say what the machine does with it and roughly what it costs.",
    groups: [
      {
        entries: [
          {
            by: "Shimon Schocken, Noam Nisan",
            marker: "course",
            note: "Build a computer from a NAND gate up through an operating system. The bottom rung done rather than described.",
            title: "Nand to Tetris",
            url: "https://www.nand2tetris.org/"
          },
          {
            by: "Charles Petzold",
            marker: "book",
            note: "The same ladder in prose, and a different register. Read instead of Nand to Tetris if you want the map before the construction.",
            title: "Code"
          },
          {
            by: "Casey Muratori",
            marker: "video",
            note: "The cost lens on the same machine: what a line of code costs and why.",
            title: "Computer Enhance",
            url: "https://www.computerenhance.com/"
          },
          {
            by: "Abelson and Sussman",
            marker: "book",
            note: "The deepest available treatment of what an abstraction is, free online, with the 1986 MIT lectures and OCW 6.001 alongside it.",
            title: "Structure and Interpretation of Computer Programs",
            url: "https://sarabander.github.io/sicp/"
          },
          {
            by: HILLEL_WAYNE,
            marker: "paper",
            note: "Read here rather than with the formal methods material, because it is the best short account of why a correct idea loses to a convenient one.",
            title: "Why Don't People Use Formal Methods?",
            url: "https://www.hillelwayne.com/post/why-dont-people-use-formal-methods/"
          }
        ]
      }
    ],
    lede: "What a line of code actually does to the machine, and roughly what it costs. You can read an agent's output only to the depth you can read the machine underneath it.",
    number: 2,
    pairWith:
      "Build it with Nand to Tetris, read Code for the map, then take SICP when you want to know what an abstraction actually is.",
    slug: "how-the-machine-works",
    title: "How the machine works"
  },
  {
    doneWhen:
      "Before any code exists, you can state the one thing the user does that the system must never break.",
    groups: [
      {
        entries: [
          {
            by: "Rob Fitzpatrick",
            marker: "book",
            note: "Customer conversations without the flattery. Short, funny, and the fastest read on this list.",
            title: "The Mom Test",
            url: "https://www.momtestbook.com/"
          },
          {
            by: "Ryan Singer, Basecamp",
            marker: "book",
            note: "Free online, opinionated, and enjoyable. The appetite framing, fix the time and vary the scope, is the most transferable idea in it.",
            title: "Shape Up",
            url: "https://basecamp.com/shapeup"
          },
          {
            by: "Teresa Torres",
            marker: "book",
            note: "Opportunity solution trees, with a blog that is easier to start with.",
            title: "Continuous Discovery Habits",
            url: "https://www.producttalk.org/"
          },
          {
            by: "Gojko Adzic",
            marker: "book",
            note: "Turning a decision into executable acceptance criteria.",
            title: "Specification by Example",
            url: "https://www.manning.com/books/specification-by-example"
          },
          {
            by: "Scott Wlaschin",
            marker: "book",
            note: "Types as a specification of what is representable, the closest thing to a compile-time check on a requirement.",
            title: "Domain Modeling Made Functional",
            url: "https://pragprog.com/titles/swdddf/domain-modeling-made-functional/"
          },
          {
            by: "Michael Jackson",
            marker: "book",
            note: "No stable public URL, so cite by title. The best treatment of why the hard part of a requirement is the boundary between the machine and the world it models.",
            title: "Problem Frames"
          }
        ]
      }
    ],
    lede: "How to work out what to build before any code exists: getting a requirement out of real users instead of guessing, and turning it into something you can check.",
    number: 3,
    pairWith:
      "Start with The Mom Test for the conversations, then Domain Modeling Made Functional to put the requirement into types.",
    slug: "deciding-what-to-build",
    title: "Deciding what to build"
  },
  {
    doneWhen:
      "tlc finds an interleaving bug you predicted before running it, or your model passes conformance against your own service's traces.",
    groups: [
      {
        blurb:
          "Start with the video course, not the logic book. Lamport teaches the artifact, and the artifact is the point.",
        entries: [
          {
            by: "Leslie Lamport",
            marker: "video",
            note: "The spine of this stage, and genuinely watchable once you accept that the first two videos are the price of admission.",
            title: "The TLA+ Video Course",
            url: "https://lamport.azurewebsites.net/video/videos.html"
          },
          {
            by: HILLEL_WAYNE,
            marker: "course",
            note: "The written on-ramp, better at explaining what a spec is for.",
            title: "Learn TLA+",
            url: "https://learntla.com/"
          },
          {
            by: HILLEL_WAYNE,
            marker: "book",
            note: "The prerequisite this stage was missing: logic for working programmers, no math background required.",
            title: "Logic for Programmers",
            url: "https://logicforprogrammers.com/"
          },
          {
            by: "Daniel Jackson",
            marker: "lab",
            note: "The most immediately satisfying tool here. Write a small model, hit run, and it draws you a counterexample you can click through.",
            title: "Alloy",
            url: "https://alloytools.org/"
          }
        ],
        heading: "The artifact and the tool"
      },
      {
        blurb:
          "Proof, model checking, and the current shape of spec-first tooling. Templates are not evidence, so the falsifier sits here too.",
        entries: [
          {
            marker: "paper",
            note: "The falsifier for any claim that the model has this handled. Agents formally model eleven real system artifacts in TLA+, and the strongest models still fail on conformance for the largest ones.",
            title: "SysMoBench",
            url: "https://arxiv.org/abs/2509.23130"
          },
          {
            by: "Pierce et al.",
            marker: "course",
            note: "Proofs about programs, in Coq, free.",
            title: "Software Foundations",
            url: "https://softwarefoundations.cis.upenn.edu/"
          },
          {
            marker: "course",
            note: "Specifications and verification in one language, tutorial assuming no logic background.",
            title: "Dafny",
            url: "https://dafny.org/"
          },
          {
            marker: "course",
            note: "Bounded model checking for Rust, the practical industrial entry point.",
            title: "Kani",
            url: "https://github.com/model-checking/kani"
          },
          {
            marker: "book",
            note: "For the current shape of spec-first tooling. Both are templates, not evidence.",
            title: "GitHub Spec Kit and Kiro",
            url: "https://github.com/github/spec-kit"
          },
          {
            marker: "paper",
            note: "The interface contract for tool use. Specifying an agent's tool surface is this skill applied.",
            title: "The MCP specification",
            url: "https://modelcontextprotocol.io"
          },
          {
            marker: "paper",
            note: "Read as a model of what a legible specification looks like when it is designed to be understood rather than to be clever.",
            title: "The Raft paper",
            url: "https://raft.github.io/"
          }
        ],
        heading: "Proof and its falsifier"
      }
    ],
    lede: "How to write a specification precise enough that a machine can execute it, then check the result against the system's own behavior.",
    number: 4,
    pairWith:
      "Watch Lamport first for the artifact, then read Wayne for how specs get adopted. Learn TLA+ alone and you write specs nobody runs.",
    slug: "specifying-so-a-machine-can-execute-it",
    title: "Specifying so a machine can execute it"
  },
  {
    doneWhen:
      "Given a 10k-line repository you have never seen, you can name where a given behavior is decided and point at the tool output that proves it.",
    groups: [
      {
        entries: [
          {
            by: "Robert Nystrom",
            marker: "book",
            note: "Build a parser, a resolver, and a bytecode VM. Every indexer, analyzer, and code-graph tool becomes readable afterward, because you have written the thing they are built from. Also the best-written technical book on this list.",
            title: "Crafting Interpreters",
            url: "https://craftinginterpreters.com/"
          },
          {
            by: "Michael Feathers",
            marker: "book",
            note: "Cite by title. Sensing and separation, the canonical text on making untested code observable, which is what reading agent output requires.",
            title: "Working Effectively with Legacy Code"
          },
          {
            by: "Felienne Hermans",
            marker: "book",
            note: "How reading code actually works, and why unfamiliar code is slow rather than hard.",
            title: "The Programmer's Brain",
            url: "https://www.manning.com/books/the-programmers-brain"
          },
          {
            marker: "lab",
            note: "Soundness versus completeness, and Tricorder's finding that a noisy check trains developers to ignore the tool.",
            title: "Static analysis",
            url: "https://github.com/google/tricorder"
          },
          {
            marker: "paper",
            note: "SCIP, Tree-sitter, and the Language Server Protocol, read as specifications of what a tool can know about code.",
            title: "Tooling specifications",
            url: "https://microsoft.github.io/language-server-protocol/"
          }
        ]
      }
    ],
    lede: "How to reach a judgment about code you did not type, which is now most of the code in front of you.",
    number: 5,
    pairWith:
      "Read Crafting Interpreters to see how the tools are built, then Legacy Code for the code you actually inherit, which usually has no tests.",
    slug: "reading-code-you-did-not-write",
    title: "Reading code you did not write"
  },
  {
    doneWhen:
      "Deliberately break the code and a test fails, with a mutation score above zero, and a fuzz target runs ten minutes without a new crash.",
    groups: [
      {
        blurb:
          "Start with the follow-along material. Testing is the stage where a video course beats a book most clearly, because the loop of write, run, watch it fail is something you learn by doing.",
        entries: [
          {
            by: "Miško Hevery",
            marker: "video",
            note: "One hour twenty-two minutes, and the best method-first treatment available. The tradeoff between unit, integration, system, and end-to-end tests on scope, speed, and isolation; then refactoring a function so its async call becomes testable; then the anatomy of a test as setup, stimulus, and expectation. Tools appear as illustrations of the method rather than as the subject.",
            title: "Web App Testing",
            url: "https://master.dev/courses/web-app-testing/"
          },
          {
            by: "Emily Bache",
            marker: "lab",
            note: "The same method applied until it holds. Take a legacy function with tangled conditionals, pin its behavior with characterization tests, then refactor without changing what it does.",
            title: "Gilded Rose refactoring kata",
            url: "https://github.com/emilybache/GildedRose-Refactoring-Kata"
          },
          {
            marker: "course",
            note: "Free material on testing and refactoring as teachable technique rather than tool usage.",
            title: "Samman Technical Coaching",
            url: "https://sammancoaching.org/"
          },
          {
            marker: "paper",
            note: "Software Engineering at Google chapter 11, free, and the org-scale account of why a test suite decays.",
            title: "Testing Overview",
            url: "https://abseil.io/resources/swe-book/html/ch11.html"
          },
          {
            marker: "corpus",
            note: "Short practical posts, method over library.",
            title: "Google Testing Blog",
            url: "https://testing.googleblog.com/"
          },
          {
            by: "Harry Percival",
            marker: "book",
            note: "Free. TDD taught by building a real application, with a sense of humor about how badly it goes at first.",
            title: "Obey the Testing Goat",
            url: "https://www.obeythetestinggoat.com/"
          },
          {
            by: "Antonio Morales",
            marker: "course",
            note: "Free. Ten exercises that fuzz real CVEs in real projects. The most satisfying thing on this list, because you find actual bugs.",
            title: "Fuzzing101",
            url: "https://github.com/antonio-morales/Fuzzing101"
          },
          {
            by: "Andreas Zeller et al.",
            marker: "book",
            note: "Free and complete. The reference version of the same subject.",
            title: "The Fuzzing Book",
            url: "https://www.fuzzingbook.org/"
          },
          {
            marker: "lab",
            note: "Property-based testing in TypeScript and Python. Hypothesis shrinks failures into the smallest example, which is the demo that converts people.",
            title: "fast-check and Hypothesis",
            url: "https://fast-check.dev/"
          },
          {
            by: "John Hughes",
            marker: "paper",
            note: "What property-based testing found that example-based testing could not.",
            title: "In praise of property-based testing",
            url: "https://increment.com/testing/in-praise-of-property-based-testing/"
          },
          {
            marker: "course",
            note: "Stryker and mutmut. The check on the check: coverage says a line ran, mutation score says a test would have noticed.",
            title: "Mutation testing",
            url: "https://stryker-mutator.io/"
          },
          {
            marker: "lab",
            note: "Browser and dependency testing you can have running in an afternoon.",
            title: "Playwright and Testcontainers",
            url: "https://playwright.dev/"
          },
          {
            by: "Andreas Zeller",
            marker: "book",
            note: "Cite by title. The book-length treatment, in a different register.",
            title: "Why Programs Fail"
          }
        ],
        heading: "The method and the loop"
      },
      {
        blurb:
          "Every item here names a different failure mode. Example-based tests check the cases you thought of. Property-based tests check the ones you did not. Fuzzing checks crash and memory safety at volume. Mutation testing checks the tests.",
        entries: [
          {
            marker: "corpus",
            note: "The reference model for this stage. 155.8 KSLOC of C against 92,053.1 KSLOC of test code, four independent harnesses, 100% branch and MC/DC coverage, and a soak test of about 248.5 million test instances before a release.",
            title: "How SQLite is tested",
            url: "https://www.sqlite.org/testing.html"
          },
          {
            marker: "corpus",
            note: "The best worked corpus of falsification in the field. Each report names the property it tested and shows the history that broke it.",
            title: "Jepsen",
            url: "https://jepsen.io/analyses"
          },
          {
            by: "Kohavi, Tang, Xu",
            marker: "book",
            note: "Free companion material. The discipline of deciding in advance what result would change your mind.",
            title: "Trustworthy Online Controlled Experiments",
            url: "https://experimentguide.com/"
          },
          {
            marker: "book",
            note: "For when you cannot randomize. Both free.",
            title: "Causal Inference: The Mixtape and What If",
            url: "https://mixtape.scunning.com/"
          },
          {
            marker: "lab",
            note: "Free labs. The failure lens on security, learned by breaking things.",
            title: "PortSwigger Web Security Academy",
            url: "https://portswigger.net/web-security"
          },
          {
            marker: "paper",
            note: "Security as a verifiable checklist rather than a review posture.",
            title: "OWASP ASVS",
            url: "https://asvs.owasp.org/"
          },
          {
            by: "Forsgren, Humble, Kim",
            marker: "book",
            note: "Delivery measured as a rate rather than asserted, and the source of the DORA metrics.",
            title: "Accelerate",
            url: "https://itrevolution.com/product/accelerate/"
          },
          {
            marker: "course",
            note: "The ledger discipline: a prediction cannot be recorded without naming the command that would refute it, and a verdict cannot be recorded without evidence.",
            title: "The scientific loop as a gate",
            url: "https://ethang.dev/blog/skills-that-teach-the-scientific-method"
          }
        ],
        heading: "What each instrument actually checks"
      }
    ],
    lede: "Tools that produce a number instead of an opinion: coverage, mutation score, fuzzing, property tests, and the measurements that say whether the code does what you asked.",
    number: 6,
    pairWith:
      "Start with Web App Testing, then add one measurement you do not already have: mutation score, a fuzz target, or a property test.",
    slug: "checking-the-result-by-measuring-it",
    title: "Checking the result by measuring it"
  },
  {
    doneWhen:
      "An SLO whose error budget burned, and one incident postmortem recording a hypothesis the evidence falsified.",
    groups: [
      {
        blurb:
          "The expensive-to-check side of the job happens after deploy, in cost, latency, and failure. This is where the economics live, and the free Google books are unusually readable for their length.",
        entries: [
          {
            by: "Martin Kleppmann",
            marker: "book",
            note: "The model of correctness under partition, which is the reasoning an agent cannot do for you.",
            title: "Designing Data-Intensive Applications",
            url: "https://dataintensive.net/"
          },
          {
            by: "Robert Morris",
            marker: "video",
            note: "MIT 6.5840. Lectures, labs, and papers free. Implementing Raft remains the most reliable way to learn why consensus is hard.",
            title: "Distributed Systems",
            url: "https://nil.csail.mit.edu/6.5840/2025/"
          },
          {
            by: "Andy Pavlo",
            marker: "video",
            note: "CMU 15-445. Free lectures, and the most entertaining database course in existence. The invariants agents break most often live in the schema and the transaction boundary.",
            title: "Database Systems",
            url: "https://15445.courses.cs.cmu.edu/fall2024/"
          },
          {
            by: "Arpaci-Dusseau",
            marker: "book",
            note: "Free. The substrate the cost model sits on.",
            title: "Operating Systems: Three Easy Pieces",
            url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
          },
          {
            marker: "book",
            note: "The timeout and partial-failure reasoning behind any retry you write. A timeout does not prove the request failed, which is the judgment an agent will not supply.",
            title: "Beej's Guide to Network Programming",
            url: "https://beej.us/guide/bgnet/"
          },
          {
            by: "Brendan Gregg",
            marker: "book",
            note: "Measurement before optimization, with the tools to do the measuring, plus the free Linux performance page.",
            title: "Systems Performance",
            url: "https://www.brendangregg.com/systems-performance-2nd-edition-book.html"
          },
          {
            marker: "book",
            note: "Error budgets and SLOs are the economics this stage covers, and Eliminating Toil is the test for what to automate.",
            title: "Site Reliability Engineering and the SRE Workbook",
            url: "https://sre.google/sre-book/table-of-contents/"
          },
          {
            marker: "lab",
            note: "Free self-paced workshops where you design a system under real constraints. The closest thing to a game in this list.",
            title: "SRE Classroom",
            url: "https://sre.google/classroom/"
          }
        ],
        heading: "Cost, latency, and failure"
      },
      {
        blurb:
          "The check on the operation itself: chaos as an experiment with a hypothesis, supply-chain integrity as a verifiable level, and observability as a discipline rather than a dashboard.",
        entries: [
          {
            marker: "book",
            note: "Free. The chapters on testing and deprecation are the practical ones.",
            title: "Software Engineering at Google",
            url: "https://abseil.io/resources/swe-book"
          },
          {
            marker: "paper",
            note: "Short, and it defines the discipline as an experiment with a hypothesis.",
            title: "Principles of Chaos Engineering",
            url: "https://principlesofchaos.org/"
          },
          {
            marker: "course",
            note: "Deterministic simulation testing; the current industrial answer to finding the interleaving bugs a staging environment will not.",
            title: "Antithesis",
            url: "https://antithesis.com/"
          },
          {
            marker: "paper",
            note: "Supply-chain integrity as a level you can verify, which matters more when agents produce the artifacts.",
            title: "SLSA",
            url: "https://slsa.dev/"
          },
          {
            by: "Majors, Fong-Jones, Miranda",
            marker: "book",
            note: "Cite by title. The publisher page returns 403 to fetches.",
            title: "Observability Engineering"
          }
        ],
        heading: "The check on the operation"
      }
    ],
    lede: "What happens after deploy: cost, latency, failure, and the economics that decide what to automate.",
    number: 7,
    pairWith:
      "Read DDIA for the theory, then pick one: the SRE books for the human process, or Antithesis and Jepsen for the machine check.",
    slug: "operating-what-shipped",
    title: "Operating what shipped"
  },
  {
    doneWhen:
      "An eval suite where a prompt change moved the score in the direction you predicted before running it.",
    groups: [
      {
        blurb:
          "What belongs here is how to know whether the thing works. Two poles: the builder's account and the auditor's.",
        entries: [
          {
            by: "Andrej Karpathy",
            marker: "video",
            note: "Build backpropagation from scratch, then a tokenizer, then a small GPT. The most watchable serious ML material available, and it removes the mystery from the thing you are prompting.",
            title: "Neural Networks: Zero to Hero",
            url: "https://karpathy.ai/zero-to-hero.html"
          },
          {
            by: "3Blue1Brown",
            marker: "video",
            note: "The animated version, if you want the intuition before the code.",
            title: "Neural networks series",
            url: "https://www.3blue1brown.com/topics/neural-networks"
          },
          {
            by: "Will Sentance",
            marker: "course",
            note: "The same ground in the lecture register, listed in full in stage 1.",
            title: "The Hard Parts of Neural Networks",
            url: "https://master.dev/courses/hard-parts-ai/"
          },
          {
            by: "Simon Prince",
            marker: "book",
            note: "Free. The reference version of the same ground.",
            title: "Understanding Deep Learning",
            url: "https://udlbook.github.io/udlbook/"
          },
          {
            by: "Chip Huyen",
            marker: "book",
            note: "Cite by title. The publisher page returns 403 to fetches, so her blog is the free entry point.",
            title: "AI Engineering",
            url: "https://huyenchip.com/blog/"
          }
        ],
        heading: "The builder's account"
      },
      {
        blurb:
          "Evals are the checking track for this stage, and the skeptical empirical lens is what keeps the builder's account honest.",
        entries: [
          {
            by: "Anthropic",
            marker: "paper",
            note: "The clearest short account of what an agent is and when not to build one.",
            title: "Building effective agents",
            url: "https://www.anthropic.com/engineering/building-effective-agents"
          },
          {
            by: "Anthropic",
            marker: "paper",
            note: "The mechanics behind context rot.",
            title: "Effective context engineering for AI agents",
            url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
          },
          {
            by: "Yan, Bischof, et al.",
            marker: "book",
            note: "The most honest operational account available free, with a blog worth following.",
            title: "What We've Learned From a Year of Building with LLMs",
            url: "https://applied-llms.org/"
          },
          {
            by: "Hamel Husain, Shreya Shankar",
            marker: "course",
            note: "A paid cohort, with free entry points at evals.info and Hamel's blog. Evals are the checking track for this stage.",
            title: "AI Evals for Engineers and Product",
            url: "https://maven.com/parlance-labs/evals"
          },
          {
            by: "Arvind Narayanan, Sayash Kapoor",
            marker: "book",
            note: "The skeptical empirical lens on the same claims.",
            title: "AI Snake Oil",
            url: "https://www.aisnakeoil.com/"
          },
          {
            marker: "lab",
            note: "Prompt injection is the standing one. The failure lens on agent security, learned by breaking things.",
            title: "OWASP Top 10 for LLM Applications",
            url: "https://genai.owasp.org/llm-top-10/"
          },
          {
            by: "Simon Willison",
            marker: "book",
            note: "The running primary record on prompt injection and agent security, written plainly and updated faster than any course.",
            title: "Simon Willison's blog",
            url: "https://simonwillison.net/"
          },
          {
            by: "Martin Fowler and colleagues",
            marker: "book",
            note: "Field notes on what teams actually hit when they build with these models.",
            title: "Exploring Generative AI",
            url: "https://martinfowler.com/articles/exploring-gen-ai.html"
          }
        ],
        heading: "The auditor's account"
      }
    ],
    lede: "How to know whether an AI feature works: what the model is doing underneath, and the evals that score it.",
    number: 8,
    pairWith:
      "Watch Karpathy to see what the model is doing, then read the eval material, because a prompt you cannot score is a guess.",
    slug: "ai-engineering-as-engineering",
    title: "AI engineering, as engineering"
  },
  {
    doneWhen:
      "Your recorded predictions beat chance at a stated horizon, over at least twenty of them.",
    groups: [
      {
        entries: [
          {
            marker: "lab",
            note: "Free interactive tools that calibrate your judgment by making you commit to answers first. The most fun way into this stage.",
            title: "Clearer Thinking",
            url: "https://www.clearerthinking.org/"
          },
          {
            by: "Annie Duke",
            marker: "book",
            note: "Separating luck from decision quality.",
            title: "Thinking in Bets"
          },
          {
            by: "Philip Tetlock, Dan Gardner",
            marker: "book",
            note: "Calibration, and how accuracy is actually scored.",
            title: "Superforecasting"
          },
          {
            by: "Julia Galef",
            marker: "book",
            note: "The motivation to notice you were wrong, which no tool supplies.",
            title: "The Scout Mindset"
          },
          {
            by: "Kohavi, Tang, Xu",
            marker: "book",
            note: "The industrial version of the same discipline.",
            title: "Trustworthy Online Controlled Experiments",
            url: "https://experimentguide.com/"
          }
        ]
      }
    ],
    lede: "Acting on a forecast, calibrating a prediction, and knowing when a measurement is worth its cost. Predicting well is trainable.",
    number: 9,
    pairWith:
      "Use Clearer Thinking to start committing to answers, then keep a written record of predictions and score yourself against it.",
    slug: "judgment-under-uncertainty",
    title: "Judgment under uncertainty"
  },
  {
    doneWhen: "You can name which claim in your design came from which paper.",
    groups: [
      {
        blurb:
          "The primary sources behind every claim above, and the reason this stage sits last: the list earns its argument before it cites it.",
        entries: [
          {
            by: "Grace Hopper",
            marker: "paper",
            note: "1954, on the programmer and coder split, and why the coder's job would be the first replaced by the computer itself.",
            title: "The programmer and the coder",
            url: "https://doi.org/10.1145/3639562"
          },
          {
            marker: "paper",
            note: "The FORTRAN preliminary report's claim that it should virtually eliminate coding and debugging, reprinted with commentary in Backus's 1978 retrospective.",
            title: "The FORTRAN preliminary report",
            url: "https://softwarepreservation.computerhistory.org/FORTRAN/paper/p45-backus.pdf"
          },
          {
            by: "Nathan Ensmenger",
            marker: "paper",
            note: "How FORTRAN and COBOL had the unintended effect of elevating their status rather than eliminating the role.",
            title: "The coder's history",
            url: "https://doi.org/10.1017/s0020859003001305"
          },
          {
            by: "Fred Brooks",
            marker: "paper",
            note: "1986. Essential versus accidental difficulty, the vocabulary this whole list depends on.",
            title: "No Silver Bullet",
            url: "https://www.cs.unc.edu/techreports/86-020.pdf"
          },
          {
            by: "Jack Reeves",
            marker: "paper",
            note: "1992. The objection that coding is design, which rules out the easy version of the argument.",
            title: "What Is Software Design?",
            url: "https://www.developerdotstar.com/mag/articles/reeves_design.html"
          },
          {
            by: "Edsger Dijkstra",
            marker: "paper",
            note: "EWD215, 1968, on why legibility is the point of an abstraction.",
            title: "Go To Statement Considered Harmful",
            url: "https://www.cs.utexas.edu/~EWD/transcriptions/EWD02xx/EWD215.html"
          },
          {
            marker: "video",
            note: "Talks on the same papers, in a conversational register, when the PDF is too dry.",
            title: "Papers We Love",
            url: "https://paperswelove.org/"
          },
          {
            marker: "video",
            note: "Interviews with the people who wrote the systems. The best commute-length source here.",
            title: "SE Radio",
            url: "https://www.se-radio.net/"
          }
        ]
      }
    ],
    lede: "The papers and talks behind everything above, for when you want the source rather than the summary.",
    number: 10,
    pairWith:
      "Read the papers for the claims, and use Papers We Love or SE Radio when a primary source is too dry to finish.",
    slug: "the-primary-record",
    title: "The primary record"
  }
];
