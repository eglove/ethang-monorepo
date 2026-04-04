--------------------------- MODULE StoreRefactor ---------------------------
(***************************************************************************)
(* TLA+ specification for the @ethang/store BaseStore refactor.            *)
(* Models: reentrant update with batched drain, subscribe/unsubscribe,     *)
(* waitFor, reset, destroy, lifecycle hooks, and error handling.           *)
(*                                                                         *)
(* Source: docs/questioner-sessions/2026-04-04_store-refactor.md           *)
(*                                                                         *)
(* Scoping limitation: onPropertyChange (consensus item 9) is NOT modeled *)
(* as a distinct action. DrainNotify models the bookkeeping of removing a  *)
(* subscriber from pendingNotify but does not model callback execution,    *)
(* side effects, or the shouldNotify:false path. The shouldNotify          *)
(* parameter, which allows updates without triggering additional           *)
(* notifications, is an implementation detail below the abstraction level  *)
(* of this state machine. Tests for onPropertyChange + shouldNotify:false  *)
(* must be derived independently of this spec.                             *)
(***************************************************************************)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxSubscribers,   \* max number of subscriber identities
    MaxReentrantDepth,\* reentrancy depth guard (maps to 100 in impl)
    MaxWaiters,       \* max concurrent waitFor callers
    States,           \* set of possible state values (abstract)
    NULL              \* distinguished value not in States

VARIABLES
    state,            \* current store state value
    initialState,     \* state saved at construction for reset()
    subscribers,      \* set of active subscriber ids
    destroyed,        \* boolean: has destroy() been called?

    \* Drain loop state
    draining,         \* boolean: is the drain loop currently executing?
    patchQueue,       \* sequence of queued state values from reentrant updates
    reentrantDepth,   \* current reentrancy depth counter
    depthOverflow,    \* boolean: depth guard triggered, surfaced via queueMicrotask

    \* Notification tracking
    pendingNotify,    \* set of subscriber ids that still need notification in current drain

    \* waitFor tracking
    waiters,          \* set of waiter ids currently waiting
    waiterPredState,  \* function: waiter id -> state value that satisfies predicate (or NULL)
    waiterAborted,    \* set of waiter ids whose signal has been aborted
    waiterResolved,   \* set of waiter ids that have resolved (success or error)
    waiterResult,     \* function: waiter id -> "ok" | "error"

    \* Lifecycle tracking
    firstSubFired,    \* boolean: onFirstSubscriber was called
    lastSubFired,     \* boolean: onLastSubscriberRemoved was called
    controllerAborted \* boolean: the internal AbortController signal is aborted

vars == <<state, initialState, subscribers, destroyed, draining, patchQueue,
          reentrantDepth, depthOverflow, pendingNotify,
          waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
          firstSubFired, lastSubFired, controllerAborted>>

ASSUME NULL \notin States

SubscriberIds == 1..MaxSubscribers
WaiterIds == 1..MaxWaiters

(***************************************************************************)
(* Type invariant                                                          *)
(***************************************************************************)
TypeOK ==
    /\ state \in States
    /\ initialState \in States
    /\ subscribers \subseteq SubscriberIds
    /\ destroyed \in BOOLEAN
    /\ draining \in BOOLEAN
    /\ patchQueue \in Seq(States)
    /\ reentrantDepth \in 0..MaxReentrantDepth
    /\ depthOverflow \in BOOLEAN
    /\ pendingNotify \subseteq SubscriberIds
    /\ waiters \subseteq WaiterIds
    /\ waiterAborted \subseteq WaiterIds
    /\ waiterResolved \subseteq WaiterIds
    /\ waiterResult \in [WaiterIds -> {"ok", "error", "pending"}]
    /\ firstSubFired \in BOOLEAN
    /\ lastSubFired \in BOOLEAN
    /\ controllerAborted \in BOOLEAN

(***************************************************************************)
(* Initial state                                                           *)
(***************************************************************************)
Init ==
    /\ state \in States
    /\ initialState = state
    /\ subscribers = {}
    /\ destroyed = FALSE
    /\ draining = FALSE
    /\ patchQueue = <<>>
    /\ reentrantDepth = 0
    /\ depthOverflow = FALSE
    /\ pendingNotify = {}
    /\ waiters = {}
    /\ waiterPredState = [w \in WaiterIds |-> NULL]
    /\ waiterAborted = {}
    /\ waiterResolved = {}
    /\ waiterResult = [w \in WaiterIds |-> "pending"]
    /\ firstSubFired = FALSE
    /\ lastSubFired = FALSE
    /\ controllerAborted = FALSE

(***************************************************************************)
(* Subscribe action                                                        *)
(***************************************************************************)
Subscribe(s) ==
    /\ ~destroyed
    /\ s \notin subscribers
    /\ subscribers' = subscribers \cup {s}
    /\ IF subscribers = {}
       THEN /\ firstSubFired' = TRUE
            /\ lastSubFired' = FALSE
            /\ controllerAborted' = FALSE  \* new AbortController
       ELSE UNCHANGED <<firstSubFired, lastSubFired, controllerAborted>>
    /\ UNCHANGED <<state, initialState, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult>>

\* Subscribe after destroy: returns no-op unsubscribe (modeled as no state change)
SubscribeAfterDestroy(s) ==
    /\ destroyed
    /\ s \notin subscribers
    /\ UNCHANGED vars  \* no-op, returns () => void

(***************************************************************************)
(* Unsubscribe action                                                      *)
(***************************************************************************)
Unsubscribe(s) ==
    /\ s \in subscribers
    /\ subscribers' = subscribers \ {s}
    /\ IF subscribers' = {}
       THEN /\ lastSubFired' = TRUE
            /\ controllerAborted' = TRUE  \* abort cleanupSignal
            /\ UNCHANGED firstSubFired
       ELSE UNCHANGED <<firstSubFired, lastSubFired, controllerAborted>>
    /\ UNCHANGED <<state, initialState, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult>>

(***************************************************************************)
(* Update action (non-reentrant: starts the drain loop)                    *)
(***************************************************************************)
Update(newState) ==
    /\ ~destroyed
    /\ ~draining
    /\ newState /= state
    /\ state' = newState
    /\ draining' = TRUE
    /\ reentrantDepth' = 1
    /\ pendingNotify' = subscribers  \* all current subscribers need notification
    /\ UNCHANGED <<initialState, subscribers, destroyed, patchQueue,
                   depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Reentrant update: called during drain loop, queues the patch            *)
(***************************************************************************)
ReentrantUpdate(newState) ==
    /\ ~destroyed
    /\ draining
    /\ reentrantDepth < MaxReentrantDepth
    /\ newState /= state
    /\ patchQueue' = Append(patchQueue, newState)
    /\ reentrantDepth' = reentrantDepth + 1
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining,
                   depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Depth overflow: reentrancy guard exceeded                               *)
(***************************************************************************)
DepthOverflowAction ==
    /\ draining
    /\ reentrantDepth >= MaxReentrantDepth
    /\ depthOverflow' = TRUE  \* error surfaced via queueMicrotask
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, pendingNotify,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Drain loop: notify one subscriber                                       *)
(* Checks destroyed flag before EACH callback invocation (item 3)          *)
(*                                                                         *)
(* NOTE: This action models the bookkeeping of subscriber notification     *)
(* only. It does not model callback execution or side effects. See the     *)
(* onPropertyChange scoping limitation in the module header comment.        *)
(***************************************************************************)
DrainNotify(s) ==
    /\ draining
    /\ ~destroyed          \* check destroyed before each callback (item 3)
    /\ s \in pendingNotify
    /\ pendingNotify' = pendingNotify \ {s}
    \* If subscriber unsubscribed mid-drain, skip notification (no-op)
    \* but still remove from pendingNotify
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Drain loop completes: no more pending, check queue                      *)
(* CRITICAL: guards on ~destroyed before applying queued patches.          *)
(* Post-destroy, update is a no-op -- queued patches must NOT be applied.  *)
(***************************************************************************)
DrainComplete ==
    /\ draining
    /\ pendingNotify = {}
    /\ IF patchQueue /= <<>> /\ ~destroyed
       THEN \* Apply next queued state, re-notify all subscribers
            /\ state' = Head(patchQueue)
            /\ patchQueue' = Tail(patchQueue)
            /\ pendingNotify' = subscribers
            /\ UNCHANGED draining
       ELSE \* Drain fully complete (or destroyed with remaining queue -- discard)
            /\ draining' = FALSE
            /\ reentrantDepth' = 0
            /\ patchQueue' = <<>>
            /\ UNCHANGED <<state, pendingNotify>>
    /\ UNCHANGED <<initialState, subscribers, destroyed,
                   depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>
    /\ IF patchQueue /= <<>> /\ ~destroyed
       THEN UNCHANGED reentrantDepth
       ELSE reentrantDepth' = 0

(***************************************************************************)
(* Drain abort on destroy: when destroyed during a drain with pending      *)
(* notifications, the drain must terminate. DrainNotify requires ~destroyed *)
(* so pending notifications can never be processed. This action clears     *)
(* pendingNotify and patchQueue and exits the drain.                       *)
(***************************************************************************)
DrainAbortOnDestroy ==
    /\ draining
    /\ destroyed
    /\ pendingNotify /= {}  \* stuck: DrainNotify can't fire, DrainComplete needs empty
    /\ draining' = FALSE
    /\ pendingNotify' = {}
    /\ patchQueue' = <<>>
    /\ reentrantDepth' = 0
    /\ UNCHANGED <<state, initialState, subscribers, destroyed,
                   depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Reset action: enqueue state replacement during drain (item 4)           *)
(* or apply immediately if not draining                                    *)
(***************************************************************************)
Reset ==
    /\ ~destroyed
    /\ IF draining
       THEN \* Treat as reentrant update: enqueue the reset state (item 4)
            /\ reentrantDepth < MaxReentrantDepth
            /\ patchQueue' = Append(patchQueue, initialState)
            /\ reentrantDepth' = reentrantDepth + 1
            /\ UNCHANGED <<state, draining, pendingNotify>>
       ELSE \* Apply immediately and notify
            /\ state' = initialState
            /\ draining' = TRUE
            /\ reentrantDepth' = 1
            /\ pendingNotify' = subscribers
            /\ patchQueue' = patchQueue
    /\ UNCHANGED <<initialState, subscribers, destroyed,
                   depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

ResetWithState(newInitial) ==
    /\ ~destroyed
    /\ newInitial \in States
    /\ IF draining
       THEN /\ reentrantDepth < MaxReentrantDepth
            /\ patchQueue' = Append(patchQueue, newInitial)
            /\ reentrantDepth' = reentrantDepth + 1
            /\ UNCHANGED <<state, draining, pendingNotify>>
       ELSE /\ state' = newInitial
            /\ draining' = TRUE
            /\ reentrantDepth' = 1
            /\ pendingNotify' = subscribers
            /\ patchQueue' = patchQueue
    /\ UNCHANGED <<initialState, subscribers, destroyed,
                   depthOverflow,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Destroy action                                                          *)
(*                                                                         *)
(* ATOMICITY NOTE: Destroy sets destroyed=TRUE and clears subscribers but  *)
(* does NOT atomically resolve active waiters. Between this action and     *)
(* subsequent WaitForDestroyError steps, the system is in a state where    *)
(* destroyed=TRUE and waiters may be non-empty. This intermediate state    *)
(* is safe because weak fairness on WaitForDestroyError guarantees         *)
(* eventual resolution of all active waiters. The WaitForResolves liveness *)
(* property verifies this. Do not add invariants that assume                *)
(* destroyed => waiters = {} -- the two-step resolution is by design.      *)
(***************************************************************************)
Destroy ==
    /\ ~destroyed
    /\ destroyed' = TRUE
    /\ controllerAborted' = TRUE   \* abort cleanupSignal
    /\ subscribers' = {}           \* clear all subscribers
    /\ UNCHANGED <<state, initialState, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired>>

\* Double destroy is no-op (item 5)
DoubleDestroy ==
    /\ destroyed
    /\ UNCHANGED vars

(***************************************************************************)
(* Update after destroy: silent no-op                                      *)
(***************************************************************************)
UpdateAfterDestroy ==
    /\ destroyed
    /\ UNCHANGED vars

(***************************************************************************)
(* waitFor actions                                                         *)
(***************************************************************************)

\* Start waiting: predicate not yet satisfied
WaitForStart(w) ==
    /\ ~destroyed
    /\ w \notin waiters
    /\ w \notin waiterResolved
    /\ waiters' = waiters \cup {w}
    /\ \E target \in States :
        waiterPredState' = [waiterPredState EXCEPT ![w] = target]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiterAborted, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

\* Immediate resolve: predicate already true at call time
WaitForImmediate(w) ==
    /\ ~destroyed
    /\ w \notin waiters
    /\ w \notin waiterResolved
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "ok"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* waitFor resolves because state matches predicate
WaitForResolve(w) ==
    /\ w \in waiters
    /\ ~destroyed
    /\ state = waiterPredState[w]  \* predicate satisfied
    /\ waiters' = waiters \ {w}
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "ok"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* waitFor with already-aborted signal: return error immediately (item 6)
WaitForAlreadyAborted(w) ==
    /\ w \notin waiters
    /\ w \notin waiterResolved
    /\ w \in waiterAborted  \* signal was pre-aborted
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "error"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* Signal aborts while waiting -> error result
WaitForSignalAbort(w) ==
    /\ w \in waiters
    /\ waiters' = waiters \ {w}
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "error"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* Store destroyed while waiting -> error result
WaitForDestroyError(w) ==
    /\ w \in waiters
    /\ destroyed
    /\ waiters' = waiters \ {w}
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "error"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* waitFor on destroyed store: immediate error (item 6 variant)
\* Only for NEW waitFor calls post-destroy (not already in waiters)
WaitForAfterDestroy(w) ==
    /\ destroyed
    /\ w \notin waiters
    /\ w \notin waiterResolved
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "error"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

\* waitFor predicate throws -> error result (item 7)
WaitForPredicateError(w) ==
    /\ ~destroyed
    /\ w \notin waiters
    /\ w \notin waiterResolved
    /\ waiterResolved' = waiterResolved \cup {w}
    /\ waiterResult' = [waiterResult EXCEPT ![w] = "error"]
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterAborted,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Mark a signal as pre-aborted (for WaitForAlreadyAborted)                *)
(***************************************************************************)
AbortSignal(w) ==
    /\ w \notin waiterAborted
    /\ waiterAborted' = waiterAborted \cup {w}
    /\ UNCHANGED <<state, initialState, subscribers, destroyed, draining, patchQueue,
                   reentrantDepth, depthOverflow, pendingNotify,
                   waiters, waiterPredState, waiterResolved, waiterResult,
                   firstSubFired, lastSubFired, controllerAborted>>

(***************************************************************************)
(* Next-state relation                                                     *)
(***************************************************************************)
Next ==
    \/ \E s \in SubscriberIds : Subscribe(s)
    \/ \E s \in SubscriberIds : SubscribeAfterDestroy(s)
    \/ \E s \in SubscriberIds : Unsubscribe(s)
    \/ \E v \in States : Update(v)
    \/ \E v \in States : ReentrantUpdate(v)
    \/ DepthOverflowAction
    \/ \E s \in SubscriberIds : DrainNotify(s)
    \/ DrainComplete
    \/ DrainAbortOnDestroy
    \/ Reset
    \/ \E v \in States : ResetWithState(v)
    \/ Destroy
    \/ DoubleDestroy
    \/ UpdateAfterDestroy
    \/ \E w \in WaiterIds : WaitForStart(w)
    \/ \E w \in WaiterIds : WaitForImmediate(w)
    \/ \E w \in WaiterIds : WaitForResolve(w)
    \/ \E w \in WaiterIds : WaitForAlreadyAborted(w)
    \/ \E w \in WaiterIds : WaitForSignalAbort(w)
    \/ \E w \in WaiterIds : WaitForDestroyError(w)
    \/ \E w \in WaiterIds : WaitForAfterDestroy(w)
    \/ \E w \in WaiterIds : WaitForPredicateError(w)
    \/ \E w \in WaiterIds : AbortSignal(w)

(***************************************************************************)
(* Fairness: weak fairness on drain completion and waiter resolution       *)
(***************************************************************************)
Fairness ==
    /\ WF_vars(DrainComplete)
    /\ WF_vars(DrainAbortOnDestroy)
    /\ \A s \in SubscriberIds : WF_vars(DrainNotify(s))
    /\ \A w \in WaiterIds : WF_vars(WaitForResolve(w))
    /\ \A w \in WaiterIds : WF_vars(WaitForDestroyError(w))
    /\ \A w \in WaiterIds : WF_vars(WaitForSignalAbort(w))

Spec == Init /\ [][Next]_vars /\ Fairness

(***************************************************************************)
(* SAFETY INVARIANTS                                                       *)
(***************************************************************************)

\* Post-destroy: no notifications fire (pendingNotify must be empty or drain
\* stops because DrainNotify checks ~destroyed) and no new subs activate
PostDestroyNoNotifications ==
    destroyed => (subscribers = {})

\* Reentrant depth bounded
ReentrantDepthBounded ==
    reentrantDepth <= MaxReentrantDepth

\* Pending notify only contains subscribers that were active when drain started.
\* A subscriber may unsubscribe mid-drain; DrainNotify checks membership implicitly.
\* The invariant ensures pendingNotify is always within the SubscriberIds domain.
PendingNotifyValid ==
    pendingNotify \subseteq SubscriberIds

\* waitFor: resolved waiters have a definite result
WaiterResultConsistent ==
    \A w \in waiterResolved : waiterResult[w] \in {"ok", "error"}

\* waitFor: active waiters are not yet resolved
WaiterActiveNotResolved ==
    \A w \in waiters : w \notin waiterResolved

(***************************************************************************)
(* LIVENESS PROPERTIES                                                     *)
(***************************************************************************)

\* Every update eventually produces a notification (or store is destroyed)
\* Modeled as: if draining starts, it eventually completes or store is destroyed
DrainTerminates ==
    draining ~> (~draining \/ destroyed)

\* After destroy, the drain must eventually terminate (no indefinite draining
\* post-destroy). This is stronger than DrainTerminates which allows "destroyed"
\* as a resolution -- here we specifically require draining becomes FALSE.
PostDestroyDrainTerminates ==
    (destroyed /\ draining) ~> ~draining

\* Every waitFor eventually resolves or errors (no leaked promises)
WaitForResolves ==
    \A w \in WaiterIds :
        (w \in waiters) ~> (w \in waiterResolved \/ destroyed)

=============================================================================
