------------------------------- MODULE BlogPagination -------------------------------
EXTENDS Integers, Sequences, FiniteSets

(*
  TLA+ specification for blog pagination state machine.
  Models the routing and rendering behavior of the ethang-hono blog listing page
  with path-segment pagination (/blog/page/N).

  Revised to address TLA+ review objections:
    C1:  Added EmptyPageSegment transition for "/blog/page/" -> /blog
    C2:  Added explicit Parsing state; all inputs go Idle -> Parsing -> ...
    C3:  Fixed EventuallyResolves to track per-request resolution
    M1:  Added redirectType distinguishing 301 (canonical) vs 302 (other)
    M2:  MaxPage derived from TotalPosts and PageSize
    M3:  Disambiguated "none" (no request) from "root" (/blog request)
    M4:  Added InvalidNeverRenders safety property
    M5:  Strengthened PageOneIsRoot property
*)

CONSTANTS
  TotalPosts, \* Total number of blog posts
  PageSize    \* Number of posts per page (e.g., 10)

ASSUME TotalPosts \in Nat \ {0}
ASSUME PageSize \in Nat \ {0}

(* M2: Derive MaxPage from TotalPosts and PageSize (ceiling division) *)
MaxPage == (TotalPosts + PageSize - 1) \div PageSize

ASSUME MaxPage \in Nat \ {0}

(*
  M3: Disambiguated input types.
    "none"          -- no request pending (idle, no input)
    "root"          -- GET /blog (empty page segment, render page 1)
    "empty_segment" -- GET /blog/page/ (trailing slash, no page number)  [C1]
    "one"           -- GET /blog/page/1
    "valid"         -- GET /blog/page/n where 1 < n <= MaxPage
    "over_max"      -- GET /blog/page/n where n > MaxPage
    "zero"          -- GET /blog/page/0
    "negative"      -- GET /blog/page/-n
    "invalid"       -- GET /blog/page/abc (non-numeric)
*)
PageInput == {
  "none", "root", "empty_segment",
  "one", "valid", "over_max",
  "zero", "negative", "invalid"
}

(*
  C2: System states -- added "Parsing" as explicit input-parsing step.
    Idle       -- awaiting request
    Parsing    -- raw URL segment being parsed into a page number
    Validating -- page number parsed, checking bounds
    Rendering  -- rendering the page
    Redirecting -- issuing a redirect
*)
States == {
  "Idle",
  "Parsing",
  "Validating",
  "Rendering",
  "Redirecting"
}

(*
  Helper: convert integer to string (simplified for TLC)
*)
ToString(n) ==
  IF n = 1 THEN "1"
  ELSE IF n = 2 THEN "2"
  ELSE IF n = 3 THEN "3"
  ELSE IF n = 4 THEN "4"
  ELSE IF n = 5 THEN "5"
  ELSE IF n = 6 THEN "6"
  ELSE IF n = 7 THEN "7"
  ELSE IF n = 8 THEN "8"
  ELSE IF n = 9 THEN "9"
  ELSE IF n = 10 THEN "10"
  ELSE "unknown"

(* Redirect targets *)
RedirectTarget == {"/blog"} \cup {"/blog/page/" \o ToString(p) : p \in 1..MaxPage}

(* M1: Redirect type -- 301 for canonical normalization, 302 for everything else *)
RedirectType == {"301", "302"}

(* Variables -- no history to keep state space manageable *)
VARIABLES
  state,          \* Current system state
  pageInput,      \* The raw page input from the URL
  pageNumber,     \* Parsed page number (if valid)
  renderPage,     \* The page actually rendered
  redirectUrl,    \* URL to redirect to
  redirectType    \* M1: "301" (canonical) or "302" (other)

vars == <<state, pageInput, pageNumber, renderPage, redirectUrl, redirectType>>

(* Initial state *)
Init ==
  /\ state = "Idle"
  /\ pageInput = "none"       \* M3: "none" means no request pending
  /\ pageNumber = 0
  /\ renderPage = 0
  /\ redirectUrl = ""
  /\ redirectType = "302"     \* default

(* ======================================================================== *)
(* C2: All requests now go through Idle -> Parsing as the first step.       *)
(*     From Parsing, the spec branches to Validating, Redirecting, or       *)
(*     Rendering based on the parsed input.                                 *)
(* ======================================================================== *)

(* C2: Parse step -- receive input and move to Parsing state.
   For inputs that carry a page number ("valid", "over_max"), the page number
   is set here. For others it stays 0. *)
ReceiveRequest(input) ==
  /\ state = "Idle"
  /\ pageInput = "none"
  /\ input \in PageInput \ {"none"}
  /\ state' = "Parsing"
  /\ pageInput' = input
  /\ IF input = "valid" THEN
       /\ pageNumber' \in 2..MaxPage
       /\ UNCHANGED <<renderPage, redirectUrl, redirectType>>
     ELSE IF input = "over_max" THEN
       /\ pageNumber' \in (MaxPage + 1)..(MaxPage + 3)
       /\ UNCHANGED <<renderPage, redirectUrl, redirectType>>
     ELSE
       /\ pageNumber' = 0
       /\ UNCHANGED <<renderPage, redirectUrl, redirectType>>

(* ======================================================================== *)
(* Transitions from Parsing state                                           *)
(* ======================================================================== *)

(* M3/C1: "root" input (GET /blog) -> go directly to Rendering page 1 *)
ParseRoot ==
  /\ state = "Parsing"
  /\ pageInput = "root"
  /\ state' = "Rendering"
  /\ renderPage' = 1
  /\ pageNumber' = 1
  /\ pageInput' = "root"
  /\ UNCHANGED <<redirectUrl, redirectType>>

(* C1: "empty_segment" input (GET /blog/page/) -> redirect to /blog *)
ParseEmptySegment ==
  /\ state = "Parsing"
  /\ pageInput = "empty_segment"
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog"
  /\ redirectType' = "302"
  /\ pageInput' = "empty_segment"
  /\ UNCHANGED <<pageNumber, renderPage>>

(* "one" input (GET /blog/page/1) -> 301 redirect to /blog (canonical) *)
ParsePageOne ==
  /\ state = "Parsing"
  /\ pageInput = "one"
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog"
  /\ redirectType' = "301"    \* M1: canonical normalization
  /\ pageInput' = "one"
  /\ UNCHANGED <<pageNumber, renderPage>>

(* "valid" input (GET /blog/page/n, 1 < n <= MaxPage) -> Validating *)
ParseValidPage ==
  /\ state = "Parsing"
  /\ pageInput = "valid"
  /\ pageNumber \in 2..MaxPage
  /\ state' = "Validating"
  /\ pageInput' = "valid"
  /\ pageNumber' = pageNumber
  /\ UNCHANGED <<renderPage, redirectUrl, redirectType>>

(* "over_max" input (GET /blog/page/n, n > MaxPage) -> redirect to MaxPage *)
ParseOverMax ==
  /\ state = "Parsing"
  /\ pageInput = "over_max"
  /\ pageNumber > MaxPage
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog/page/" \o ToString(MaxPage)
  /\ redirectType' = "302"
  /\ pageInput' = "over_max"
  /\ pageNumber' = pageNumber
  /\ UNCHANGED <<renderPage>>

(* "zero" input -> redirect to /blog *)
ParsePageZero ==
  /\ state = "Parsing"
  /\ pageInput = "zero"
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog"
  /\ redirectType' = "302"
  /\ pageInput' = "zero"
  /\ UNCHANGED <<pageNumber, renderPage>>

(* "negative" input -> redirect to /blog *)
ParseNegative ==
  /\ state = "Parsing"
  /\ pageInput = "negative"
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog"
  /\ redirectType' = "302"
  /\ pageInput' = "negative"
  /\ UNCHANGED <<pageNumber, renderPage>>

(* "invalid" input (non-numeric) -> redirect to /blog *)
ParseInvalid ==
  /\ state = "Parsing"
  /\ pageInput = "invalid"
  /\ state' = "Redirecting"
  /\ redirectUrl' = "/blog"
  /\ redirectType' = "302"
  /\ pageInput' = "invalid"
  /\ UNCHANGED <<pageNumber, renderPage>>

(* ======================================================================== *)
(* Transitions from Validating state                                        *)
(* ======================================================================== *)

ValidateAndRender ==
  /\ state = "Validating"
  /\ pageNumber \in 1..MaxPage
  /\ state' = "Rendering"
  /\ renderPage' = pageNumber
  /\ pageNumber' = pageNumber
  /\ pageInput' = "valid"
  /\ UNCHANGED <<redirectUrl, redirectType>>

(* ======================================================================== *)
(* Reset transitions                                                        *)
(* ======================================================================== *)

Reset ==
  /\ state = "Rendering"
  /\ state' = "Idle"
  /\ pageInput' = "none"
  /\ pageNumber' = 0
  /\ renderPage' = 0
  /\ UNCHANGED <<redirectUrl, redirectType>>

ResetFromRedirect ==
  /\ state = "Redirecting"
  /\ state' = "Idle"
  /\ pageInput' = "none"
  /\ pageNumber' = 0
  /\ redirectUrl' = ""
  /\ redirectType' = "302"
  /\ UNCHANGED <<renderPage>>

(* Next-state relation *)
Next ==
  \/ \E input \in PageInput \ {"none"} : ReceiveRequest(input)
  \/ ParseRoot
  \/ ParseEmptySegment
  \/ ParsePageOne
  \/ ParseValidPage
  \/ ParseOverMax
  \/ ParsePageZero
  \/ ParseNegative
  \/ ParseInvalid
  \/ ValidateAndRender
  \/ Reset
  \/ ResetFromRedirect

(* Spec -- safety checking only (no fairness needed for invariants) *)
Spec == Init /\ [][Next]_vars

(* ======================================================================== *)
(* Safety properties                                                        *)
(* ======================================================================== *)

(* No page number < 1 is ever rendered *)
NoNegativePageRendered == (state # "Rendering") \/ (renderPage >= 1)

(*
  M5: Strengthened PageOneIsRoot property.
  Page 1 is only rendered via the "root" input (GET /blog).
  The URL /blog/page/1 must always redirect to /blog (301 canonical).
  When renderPage = 1, pageInput must be "root" and redirectUrl must be empty.
  When pageInput = "one" and we are past Parsing, redirect must be /blog with 301.
*)
PageOneIsRoot ==
  /\ (renderPage # 1) \/ ((redirectUrl = "") /\ (pageInput = "root"))
  /\ (state \in {"Redirecting", "Idle"}) /\ (pageInput = "one")
       => (redirectUrl = "/blog") /\ (redirectType = "301")

(* Redirect URLs are always valid *)
RedirectIsValid == (state # "Redirecting") \/ (redirectUrl \in RedirectTarget)

(* Page number never exceeds MaxPage when rendering *)
RenderedPageWithinBounds == (state # "Rendering") \/ (renderPage \in 1..MaxPage)

(*
  M1: Redirect type invariant -- 301 only for canonical /blog/page/1 -> /blog,
  302 for all other redirects. Only checked in Redirecting or Idle (after redirect).
*)
RedirectTypeInvariant ==
  (state \notin {"Redirecting", "Idle"}) \/
  /\ ((redirectUrl = "/blog") /\ (pageInput = "one")) => (redirectType = "301")
  /\ ((redirectUrl = "/blog") /\ (pageInput # "one")) => (redirectType = "302")
  /\ (redirectUrl # "/blog") => (redirectType = "302")

(*
  M4: Invalid inputs never reach Rendering state.
  Inputs "invalid", "negative", "zero", "empty_segment", "over_max" must
  only go through Redirecting, never Rendering.
*)
InvalidNeverRenders ==
  (state # "Rendering") \/
  ~(pageInput \in {"invalid", "negative", "zero", "empty_segment", "over_max"})

(*
  Combined safety invariant (state predicate)
*)
TypeInvariant ==
  /\ NoNegativePageRendered
  /\ PageOneIsRoot
  /\ RedirectIsValid
  /\ RenderedPageWithinBounds
  /\ RedirectTypeInvariant
  /\ InvalidNeverRenders

(*
  Temporal safety properties
*)
SafetyNoNegativeRendered == [](renderPage >= 1)
SafetyPageOneIsRoot == [](renderPage = 1 => redirectUrl = "" /\ pageInput = "root")
SafetyRedirectValid == [](state = "Redirecting" => redirectUrl \in RedirectTarget)
SafetyPageWithinBounds == [](renderPage \in {0} \cup 1..MaxPage)
SafetyInvalidNeverRenders ==
  [](pageInput \in {"invalid", "negative", "zero", "empty_segment", "over_max"}
     => state # "Rendering")

(*
  C3: Fixed liveness property.
  Every request that enters Parsing state eventually reaches either
  Rendering or Redirecting (i.e., the request is resolved).
  This is expressed per-request: whenever we are in Parsing, we eventually
  reach a terminal state (Rendering or Redirecting).
  Note: Requires fairness to verify; use LiveSpec for liveness checking.
*)
EventuallyResolves ==
  [](state = "Parsing" => <>(state \in {"Rendering", "Redirecting"}))

(* LiveSpec -- use this spec for liveness checking (includes fairness) *)
LiveSpec == Init /\ [][Next]_vars /\ WF_vars(Reset) /\ WF_vars(ResetFromRedirect)

================================================================================
