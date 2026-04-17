--------------------------- MODULE TokenSaving ---------------------------
(*
 * Token Saving — TLA+ Specification (Revision 19)
 *
 * Models three subsystems of the vibe-cli token-saving feature:
 *   1. Model Routing:  role -> model mapping with fail-fast on unknown roles
 *                      and distinct failure for valid-role-but-missing-mapping
 *   2. Search Hooks:   PreToolUse rewriting of search commands to es/rg
 *   3. Knowledge Graph: agent discoveries -> deduplicated graph -> markdown
 *
 * Revision 20 changes (debate objections — fourteenth session):
 *
 *  L14 — InterceptingLeadsToRewriting (new — O-1 fix):
 *    hookState = "intercepting" was the only hookState non-terminal state without
 *    a dedicated named liveness property. L6 (HookEventuallySettles) covers
 *    hookState ∈ {"intercepting","rewriting"} combined, but the one-property-per-
 *    non-terminal-state pattern established for graphState (L12/L13) and routingState
 *    (L9/L11) requires each intermediate state to have its own named property.
 *    From hookState = "intercepting", exactly one WF-fair exit action exists:
 *      - HookRewrite (WF_vars) → hookState = "rewriting"
 *    (No pipelineState guard; per D27, in-progress intercepts complete independently.)
 *    The hook liveness chain is now complete for all non-terminal states:
 *
 *      intercepting ~> rewriting              (L14, Revision 20 — new)
 *      rewriting    ~> {done, error}          (L6,  supplements L14)
 *
 *  L4 force_dedup transient waypoint enumerated in comment chain (O-2 fix):
 *    L4's consequent requires graphState ∈ {"collecting","done","warn"}, omitting
 *    force_dedup as an explicitly covered transient waypoint. If WF(GraphForceDedup)
 *    were weakened, the system could stutter at force_dedup without falsifying L4.
 *    The dedup_error → force_dedup (via GraphForceDedup, WF-fair) → collecting
 *    (via GraphAfterForceDedup, WF-fair) chain is now enumerated in L4's comment.
 *
 *  S6 scope annotation added at definition site (O-3 fix):
 *    D25 (ExternalPipelineAbortIsUnmodeledAbstraction) declares S6
 *    (HaltedMeansRoutingError) is a structural property of this model only.
 *    This restriction was documented in ASSUME D25 but not annotated at S6 itself.
 *    A reader inspecting S6 without cross-referencing D25 would over-interpret
 *    it as a universal system claim. Scope annotation added directly at S6.
 *
 *  L9/L11 TLC-verification status clarified (O-4 fix):
 *    D31's MaxAgents=1 scope applies to graph subsystem properties (S25/S30/S31/
 *    L4/L5). L9 (ResolvingLeadsToInvokingOrError) and L11 (ValidatingLeadsTo
 *    ResolvingOrError) are routing-state liveness properties whose reachable space
 *    is identical regardless of MaxAgents. Both are fully TLC-verified under
 *    MaxAgents=1. Comments on L9 and L11 updated with explicit scope labels.
 *
 *  D38 — FindCmds/GrepCmds command enumeration collapse (new — O-5 fix):
 *    FindCmds={"find"} and GrepCmds={"grep"} are intentional single-element
 *    collapses of the full BDD command enumerations ({find,ls,dir,gci,...} and
 *    {grep,egrep,fgrep,sls,...}). This collapse is analogous to D9 (PlainCmd
 *    normalization) and D16 (role normalization) but lacked a D-numbered ASSUME.
 *    D38 fills this documentation gap.
 *
 *  D26 extended — inter-agent concurrent close hook races declared (O-6 fix):
 *    D26 covered the per-agent two-phase write collapse. The inter-agent concurrent
 *    rename race — two tsx processes simultaneously attempting atomic rename to
 *    CLAUDE.md — was unmodeled and undeclared. D26 extended with a subsection
 *    documenting this gap; compensating integration test obligation added.
 *
 *  S6 scope annotation (continued — see O-3 fix above):
 *    Added as inline comment at the S6 predicate definition. Cross-references D25.
 *
 *  D27 extended — integration test injection mechanism specified (O-7 fix):
 *    D27 declared the design choice intentional but did not specify the action
 *    interleaving the integration test must simulate. Without this, two engineers
 *    could write incompatible tests (mock halt signal vs. artificial delay vs.
 *    real runtime pause). D27 extended with the required four-step interleaving
 *    sequence that tests must reproduce.
 *
 *  D31 extended — second .cfg and routing-only property status (O-8 fix):
 *    The largest unmitigated risk was the absence of multi-agent TLC verification.
 *    TokenSaving-MultiAgent.cfg has been created with MaxAgents=2, MaxGraphOps=3,
 *    MaxRetries=1 to exercise the cross-epoch "collecting" return branch. D31
 *    updated to reference the second configuration and record that L9/L11 are
 *    routing-only and unaffected by MaxAgents scope.
 *
 *  D12 extended — epoch-relative markdown freshness gap declared (O-9 fix):
 *    markdownState="current" encodes that a write succeeded; it does not record
 *    which epoch the write corresponds to. A halt after epoch 1 leaves markdownState=
 *    "current" reflecting epoch 1 data even if epoch 2 discoveries were never
 *    written. D12 extended with a new subsection documenting this freshness
 *    limitation; compensating test obligation added.
 *
 * Revision 19 changes (debate objections — thirteenth session):
 *
 *  L13 — RetryingLeadsToBuildingOrDedupError (new — O-1 fix):
 *    graphState='retrying' is the only non-terminal graph state without a named
 *    liveness property in L4–L12, violating the one-property-per-non-terminal-state
 *    pattern established by L8–L12. All four WF-fair exit actions exist:
 *      - GraphRetryNodeSuccess        (pendingKind="node") → graphState="building"
 *      - GraphRetryEdgeSuccess        (pendingKind="edge") → graphState="building"
 *      - GraphRetryNodeStillDuplicate (pendingKind="node") → graphState="dedup_error"
 *      - GraphRetryEdgeStillDuplicate (pendingKind="edge") → graphState="dedup_error"
 *    GraphHaltCleanup (WF-fair) also exits via graphState="warn" when pipelineState=
 *    "halted". S27's fourth conjunct ensures pendingKind ∈ {"node","edge"} in
 *    "retrying", so at least one pair is always enabled. Only the property name was
 *    absent. The graph liveness chain is now complete for all non-terminal states:
 *
 *      retrying    ~> {building, dedup_error, warn}       (L13, Revision 19 — new)
 *      building    ~> {collecting, dedup_error, warn}     (L12, Revision 18 — renamed)
 *      collecting  ~> {done, warn}                       (L5,  Revision 1)
 *      dedup_error ~> {collecting, done, warn}           (L4,  Revision 5)
 *      writing     ~> {done, warn, collecting}           (L10, Revision 14)
 *
 *  S37 comment corrected — counterexample not constructible (O-2 fix):
 *    The prior S37 comment claimed that, if S32 were reformulated using the primed
 *    graphState' variable, "a simultaneous graphState'='writing' /\ agentsCompleted'=
 *    agentsCompleted+1 step from graphState='collecting' would pass the incorrect S32
 *    formulation while still violating S37." No action in Next simultaneously sets
 *    graphState'='writing' AND increments agentsCompleted' from graphState="collecting":
 *    GraphWriteMarkdown transitions collecting→"writing" without touching agentsCompleted;
 *    GraphWriteSuccess/GraphWriteFail increment agentsCompleted but fire from
 *    graphState="writing". The counterexample is not constructible from the current
 *    action set. Comment revised: S37's value is direct auditability without
 *    contrapositive reasoning, not regression detection over a non-constructible action.
 *
 *  D35 — MaxAgentsAtLeastOneDeclaredConstraint (new — O-3 fix):
 *    GraphWriteMarkdown guards on agentsCompleted < MaxAgents. At MaxAgents=0 this
 *    guard is permanently FALSE (agentsCompleted=0 and 0 < 0 is FALSE), making
 *    graphState="writing" unreachable and violating L5. No ASSUME formally declared
 *    this structural requirement. D35 fills the gap analogously to D31 and D34.
 *
 *  D36 — PipelineIdleInitArtifactIsDeclaredAbstraction (new — O-4 fix):
 *    Init sets pipelineState='idle'. No BDD scenario seeds or asserts this value; all
 *    BDD scenarios implicitly assume pipelineState="running". The Init "idle" is a
 *    pre-start TLA+ modeling artifact, asymmetric with D24 (inputRole=NULL Init
 *    artifact). D36 fills the documentation gap, analogous to D24.
 *
 *  D37 — HookKindBDDGlossaryGapIsDeclaredAbstraction (new — O-5 fix):
 *    hookKind (domain: {"none","es","rg"}) appears in S28 and D15. It records which
 *    hook subsystem caused a failure for post-failure diagnostic attribution. The BDD
 *    glossary has no dedicated entry for hookKind. The domain concept has clear
 *    behavioral significance but was never registered in the ASSUME discipline (D2–D34).
 *
 *  S38 — WritingAgentsCompletedBound (new — O-6 fix):
 *    graphState="writing" => agentsCompleted < MaxAgents. Structurally guaranteed by
 *    GraphWriteMarkdown's guard but auditable only via cross-action reasoning. S38
 *    makes it independently verifiable if the guard is ever refactored.
 *
 *  S20 comment extended — dedup_error exclusion documented (O-7 fix):
 *    S20 excludes dedup_error from its antecedent without documenting that
 *    retryCount > 0 in dedup_error (after GraphRetry increments and StillDuplicate
 *    re-entry) is intentional per D19. A regression resetting retryCount to 0 on
 *    StillDuplicate re-entry would pass S20 silently. Comment extended with the D19
 *    cross-reference and explicit statement of intent.
 *
 * Revision 18 changes (debate objections — twelfth session):
 *
 *  L12 RENAME — BuildingLeadsToCollectingOrDedupError →
 *    BuildingLeadsToCollectingOrDedupErrorOrWarn (T-1 fix):
 *    Revision 17 widened L12's consequent to include graphState="warn" (the
 *    GraphHaltCleanup abort path from graphState="building") but did not update
 *    the property name. The name "BuildingLeadsToCollectingOrDedupError" implied
 *    a two-element consequent; the actual consequent has always been three elements
 *    since R17: {"collecting","dedup_error","warn"}. The name and body are now
 *    consistent. Updated throughout: property definition, .cfg PROPERTY entry,
 *    liveness chain comment table, and module-level .cfg reference.
 *
 *  D34 — MaxRetriesThreeModelCheckingScopeIsDeclaredAbstraction (new — T-2 fix):
 *    MaxRetries=3 in the .cfg is a fixed scope boundary analogous to D31
 *    (MaxAgents=1). The value was 1 in Revision 7 and raised to 3 in Revision 9
 *    (D4 fix) to make the full BDD retry ladder and the force-dedup boundary
 *    reachable by TLC. The ASSUME discipline established by D31 was not applied
 *    to MaxRetries at the time of that raise. D34 formally declares the scope
 *    with enumerated affected properties and compensating integration tests.
 *    Note: T-2's claim that MaxRetries=1 is the current value is inaccurate for
 *    Revision 9 and later; the value has been 3 since Revision 9.
 *
 *  S37 — WritingStateGatesAgentsCompleted (new — T-3 fix):
 *    S32 (CloseHookPrecedesNextEpoch) encodes the post-condition direction:
 *      agentsCompleted' > agentsCompleted => graphState = "writing" (pre-state)
 *    The logically equivalent contrapositive — graphState /= "writing" (pre-state)
 *    => agentsCompleted' = agentsCompleted — is added as a distinct named property.
 *    S37 makes the gating pre-condition directly auditable without requiring a
 *    reader to apply contrapositive reasoning through S32's post-condition framing.
 *    If S32 were accidentally reformulated using the primed graphState' variable,
 *    a simultaneous graphState'="writing" /\ agentsCompleted'=agentsCompleted+1
 *    step from graphState="collecting" would pass the incorrect S32 formulation
 *    while still violating S37. S37 is not merely redundant coverage of S32;
 *    it provides independent auditability from the opposite reasoning direction.
 *
 * Revision 17 changes (TLC failure — eleventh session):
 *
 *  L12 corrected — BuildingLeadsToCollectingOrDedupError consequent widened:
 *    TLC found a 10-state counter-example: StartPipeline picks mappingEntryExists=FALSE
 *    and inputRole=Expert; ValidateRoleSuccess → HookInterceptEs → GraphStartCollecting
 *    → GraphAddNode (graphState="building"); HookRewrite → HookExecuteSuccess; then
 *    MappingLookupFail atomically sets pipelineState="halted"; GraphHaltCleanup fires
 *    from graphState="building" → graphState="warn". The system stutters with
 *    graphState="warn" — satisfying no element of {"collecting","dedup_error"} —
 *    violating L12.
 *
 *    Root cause: L12's consequent omitted "warn". GraphHaltCleanup is WF-fair and
 *    is enabled whenever pipelineState="halted" /\ graphState ∈ active states,
 *    including "building". The abort path (building → warn via halt cleanup) is a
 *    correct reachable transition; the liveness property simply failed to enumerate
 *    it. Fix: consequent extended to {"collecting","dedup_error","warn"}.
 *
 *    Comment chain at the property definition updated to match.
 *
 * Revision 16 changes (debate objections — tenth session):
 *
 *  D31 expanded — three-point risk-register entries per unverified property:
 *    D31 previously listed S25/S30/S31 as unverified for MaxAgents > 1 but
 *    omitted L4 (DuplicateEventuallyResolves) and L5 (GraphEventuallyFinishes),
 *    whose liveness witnesses can traverse the multi-epoch "collecting" return
 *    branch. Added three-point entries (why unverified / boundary condition /
 *    compensating test) for all five affected properties: S25, S30, S31, L4, L5.
 *
 *  S2 strengthened — MissingMappingNeverInvokes halt conjunct (T2 fix):
 *    S1 (UnknownRoleNeverInvokes) was strengthened in R15 with the direct
 *    assertion (routingState = "error" => pipelineState = "halted"). S2
 *    (MissingMappingNeverInvokes) was not updated symmetrically despite
 *    MappingLookupFail making an identical atomic write. New conjunct added
 *    to S2, making both invariants symmetric and independently auditable.
 *
 *  L12 — BuildingLeadsToCollectingOrDedupError (new liveness — T1 fix):
 *    graphState="building" ~> graphState ∈ {"collecting","dedup_error"}.
 *    Follows the naming pattern established by L8/L9/L10/L11 (one named
 *    liveness property per non-terminal state). graphState="building" had
 *    four WF-fair exit actions but no named liveness property. S27's fifth
 *    conjunct prevents the pendingKind="none" deadlock structurally; L12
 *    names the progress guarantee explicitly.
 *
 * Revision 15 changes (debate objections — ninth session):
 *
 *  L11 — ValidatingLeadsToResolvingOrError (new liveness):
 *    routingState="validating" ~> routingState in {"resolving","error"}.
 *    Analogous gap to L9 (ResolvingLeadsToInvokingOrError): a deadlock in
 *    "validating" state violated no named liveness property in L1–L10. From
 *    routingState="validating" exactly two actions are enabled:
 *      - ValidateRoleSuccess fires if inputRole ∈ Roles  → "resolving"
 *      - ValidateRoleFail    fires if inputRole ∉ Roles  → "error"
 *    Both have WF_vars fairness. L11 completes the full routing liveness chain:
 *      validating ~> {resolving,error}  (L11, new)
 *      resolving  ~> {invoking,error}   (L9,  Revision 14)
 *      invoking   ~> done              (L8,  Revision 11)
 *
 *  S1 strengthened — UnknownRoleNeverInvokes error-terminal conjunct:
 *    Prior form asserted resolvedModel=NULL and routingState≠"done" for unknown
 *    roles but did not directly assert pipelineState="halted" in the error
 *    terminal. New conjunct added: (routingState = "error" => pipelineState = "halted").
 *    Derivable from S6 (HaltedMeansRoutingError) combined with ValidateRoleFail's
 *    simultaneous writes, but naming it in S1 makes the halt guarantee an auditable
 *    part of the unknown-role contract rather than a cross-invariant inference.
 *
 *  S36 — HookErrorClearsCommand (new invariant):
 *    hookState="error" => hookCommand=NULL. HookExecuteFail structurally sets
 *    hookCommand'=NULL, but no named invariant verified this. S15 (HookCleanup
 *    Complete) asserts hookCommand=NULL only for hookState="done". A regression
 *    preserving hookCommand in the error terminal (e.g., for diagnostic logging)
 *    would pass S15 without this invariant. S36 closes that gap, symmetric to S15.
 *
 *  D28 — HookEvaluationOrderAndDelegationChainIsDeclaredAbstraction (new):
 *    The real hook configuration evaluates es-hook before rg-hook (by array index)
 *    in a sequential delegation chain. In TLA+, HookInterceptEs and HookInterceptRg
 *    are non-deterministic alternatives with no ordering constraint. New ASSUME
 *    formally registers this divergence.
 *
 *  D29 — IdentityOverrideCodePathGapIsDeclaredAbstraction (new):
 *    BDD scenario B7 documents the identity-override path: $Model provided equals
 *    the role-mapped model. In TLA+, ResolveModel does not distinguish this case
 *    from any other valid override. B7 is only a Gherkin comment, not a formal
 *    TLA+ property. New ASSUME formally registers this gap.
 *
 *  D30 — DedupErrorNotificationPayloadIsUnmodeled (new):
 *    BDD specifies the dedup_error notification to the agent includes both the
 *    duplicate path and the current retryCount value. TLA+ has no notification
 *    variable. D7 covers path-substitution semantics but not payload content.
 *    New ASSUME formally registers this gap.
 *
 *  D31 — MaxAgentsOneModelCheckingScopeIsDeclaredAbstraction (new):
 *    MaxAgents=1 in the .cfg means TLC never exercises the multi-epoch "collecting"
 *    return branch of GraphWriteSuccess/GraphWriteFail. S25/S30/S31 are unverified
 *    for multi-agent (MaxAgents > 1) scenarios by TLC. New ASSUME formally declares
 *    this scope limitation.
 *
 *  D32 — GraphRetryEdgeSingleNodeForcedExhaustionIsDeclaredAbstraction (new):
 *    When |graphNodes|=1 and pendingEdge is the unique self-loop <<n,n>>,
 *    GraphRetryEdgeSuccess's combined guard (\notin graphEdges /\ /= pendingEdge)
 *    eliminates all candidates — the action is permanently disabled. The retry
 *    budget exhausts via GraphRetryEdgeStillDuplicate alone, triggering
 *    GraphForceDedup. No BDD scenario covers this path; no prior ASSUME declared it.
 *
 *  D33 — CommandTokenRewriteOnlyIsDeclaredAbstraction (new):
 *    HookRewrite models the command rewrite as hookRewritten=TRUE only, with no
 *    encoding of the actual token replacement ("find"→"es", "grep"→"rg").
 *    New ASSUME formally registers this abstraction.
 *
 * Revision 14 changes (debate objections — eighth session):
 *
 *  ACTION FIX — GraphRetryEdgeSuccess pendingEdge self-substitution bug:
 *    GraphRetryEdgeSuccess selected a replacement edge using the guard
 *    <<from,to>> \notin graphEdges, but did not exclude pendingEdge. Although
 *    pendingEdge \in graphEdges (it was detected as a duplicate), and so the
 *    \notin guard already excludes it analytically, the omission is asymmetric
 *    with R12's GraphRetryNodeSuccess fix. A future change to the path by which
 *    "retrying" is entered could make pendingEdge \notin graphEdges, enabling a
 *    non-productive retry cycle. Fix: guard extended with <<from,to>> /= pendingEdge,
 *    symmetric with the R12 node fix (path /= pendingNode).
 *
 *  RENAME — GraphNodeBuildSuccess (was: GraphBuildSuccess):
 *    R12 established the Graph{Node,Edge}* naming convention and renamed
 *    GraphDuplicateDetected → GraphNodeDuplicateDetected, but did not apply the
 *    same rename to GraphBuildSuccess. BDD cross-references already use
 *    GraphNodeBuildSuccess, creating a cross-document naming inconsistency. Renamed
 *    throughout: action definition, Next, Fairness, and all comments.
 *
 *  ACTION FIX — GraphHaltCleanup graphOpsCount symmetry:
 *    GraphHaltCleanup reset retryCount to 0 but left graphOpsCount UNCHANGED,
 *    asymmetric with GraphWriteSuccess and GraphWriteFail which reset both. Since
 *    GraphHaltCleanup is the abort-path terminal for the graph subsystem, no next
 *    epoch follows — but leaving graphOpsCount non-zero in the "warn" terminal state
 *    is inconsistent and prevents S35 (GraphTerminalOpsClean) from holding. Fixed:
 *    graphOpsCount' = 0 added to GraphHaltCleanup. New invariant S35 formally
 *    verifies graphState in {done,warn} => graphOpsCount = 0.
 *
 *  D25 — ExternalPipelineAbortIsUnmodeledAbstraction:
 *    BDD B2 describes pipelineState transitioning to "halted" from an external
 *    abort signal. In TLA+, only ValidateRoleFail and MappingLookupFail set
 *    pipelineState="halted", so S6 (HaltedMeansRoutingError) is a structural
 *    property of the model, not a universal system claim. New ASSUME formally
 *    declares this divergence.
 *
 *  D26 — TwoPhaseWriteCollapseIsDeclaredAbstraction:
 *    BDD defines a two-phase write mechanism (write temp file, then rename) with
 *    a distinct rename-failure scenario. TLA+ collapses both phases to a single
 *    GraphWriteMarkdown action with no rename-failure counterpart. New ASSUME
 *    formally declares this collapse.
 *
 *  D27 — HookActionsCompleteAfterHaltIsDeclaredAbstraction:
 *    HookRewrite, HookExecuteSuccess, and HookExecuteFail lack pipelineState=
 *    "running" guards. A concurrent ValidateRoleFail can set pipelineState=
 *    "halted" while hookState="intercepting", allowing hook actions to complete
 *    after pipeline halt. This design choice is intentional (avoid mid-intercept
 *    abandonment) but was undeclared. New ASSUME formally documents it.
 *
 *  S35 — GraphTerminalOpsClean (new invariant):
 *    graphState in {done,warn} => graphOpsCount = 0. Formally verifies the epoch
 *    counter is always reset at the terminal state boundary. Requires the
 *    GraphHaltCleanup graphOpsCount fix above to hold in the "warn" case.
 *
 *  L9 — ResolvingLeadsToInvokingOrError (new liveness):
 *    routingState="resolving" ~> routingState in {invoking,error}. Analogous gap
 *    to L8, which closed the invoking→done chain. A deadlock in "resolving" state
 *    violated no liveness property in L1–L8.
 *
 *  L10 — WritingLeadsToNextState (new liveness):
 *    graphState="writing" ~> graphState in {done,warn,collecting}. WF fairness
 *    on GraphWriteSuccess and GraphWriteFail provides progress but no named
 *    liveness property captured the writing→next transition.
 *
 * Revision 13 changes (debate objections — seventh session):
 *
 *  D23 — InvalidModelStringsUnmodeledIsDeclaredAbstraction:
 *    AllModels = Models ∪ {NULL}. Invalid model strings such as "gpt-4" or
 *    "claude-opus-99" cannot be selected by StartPipeline's nondeterminism.
 *    BDD has two explicit halt-on-invalid-model scenarios ("Config mapping
 *    resolves to out-of-enum model" and "Explicit Model override with invalid
 *    value") with no TLA+ counterpart. New ASSUME formally registers this
 *    divergence, closing the omission from the ASSUME discipline (D2–D22).
 *
 *  D24 — NullInputRoleStructurallyUnreachableIsDeclaredAbstraction:
 *    StartPipeline assigns inputRole from AllRoles = Roles ∪ {InvalidRole}.
 *    NULL is not in AllRoles, so after StartPipeline fires inputRole is never
 *    NULL. BDD's "Role parameter is required" halt scenario (NULL/missing role
 *    detected before the routing state machine starts) is therefore structurally
 *    unreachable in TLA+. New ASSUME formally registers this gap, analogous to
 *    the InvalidRole model value that makes D23 symmetric.
 *
 *  S27 fifth conjunct — building-state pendingKind coherence:
 *    PendingCoherence (S27) previously asserted
 *      graphState = "retrying" => pendingKind ∈ {"node","edge"}
 *    but omitted the symmetric conjunct for graphState = "building". A
 *    refactoring entering "building" with pendingKind = "none" would disable
 *    all four building-exit actions (GraphNodeBuildSuccess, GraphEdgeBuildSuccess,
 *    GraphNodeDuplicateDetected, GraphEdgeDuplicateDetected), creating a silent
 *    deadlock that passes S1–S34 unchanged. New fifth conjunct added:
 *      graphState = "building" => pendingKind ∈ {"node","edge"}
 *    This is the direct symmetric complement of the Revision 11 retrying-state
 *    conjunct. The .cfg INVARIANT entry for PendingCoherence picks it up
 *    automatically.
 *
 * Revision 12 changes (debate objections — sixth session):
 *
 *  ACTION FIX — GraphRetryNodeSuccess pendingNode self-substitution:
 *    GraphRetryNodeSuccess selected from NodePaths \ graphNodes but did not
 *    exclude pendingNode. Since pendingNode is not yet in graphNodes (it is
 *    the pending item, not yet accepted), it satisfies path \notin graphNodes
 *    and can be chosen as its own substitute, producing a non-productive retry
 *    cycle that exhausts retryCount without making progress toward accepting
 *    a new node. Fixed: guard extended with path /= pendingNode.
 *
 *  RENAME — GraphDuplicateDetected → GraphNodeDuplicateDetected:
 *    GraphDuplicateDetected was asymmetrically named relative to its paired
 *    action GraphEdgeDuplicateDetected. All other paired node/edge actions use
 *    the Graph{Node,Edge}* convention (GraphNodeBuildSuccess/GraphEdgeBuildSuccess,
 *    GraphRetryNodeSuccess/GraphRetryEdgeSuccess, etc.). Renamed to
 *    GraphNodeDuplicateDetected for consistency. Updated in Next, Fairness,
 *    and all comments.
 *
 *  D19 — StillDuplicateRetryCountInheritanceIsDeclaredAbstraction:
 *    GraphRetryNodeStillDuplicate and GraphRetryEdgeStillDuplicate re-enter
 *    dedup_error with retryCount unchanged (inherited from the prior cycle).
 *    BDD implies fresh-cycle semantics: retryCount=0 at dedup_error entry for
 *    a new substitute path. TLA+ uses a single shared retry budget across all
 *    substitution attempts, not per-substitution. New ASSUME formally registers
 *    this divergence.
 *
 *  D20 — MaxGraphOpsSilentEpochBoundaryIsDeclaredAbstraction:
 *    When graphOpsCount = MaxGraphOps, GraphAddNode and GraphAddEdge are
 *    silently disabled. The BDD scenario 'graphOpsCount at MaxGraphOps boundary'
 *    asserts the system does not silently drop the add-operation without
 *    notifying the agent. In TLA+, the epoch simply completes: GraphWriteMarkdown
 *    becomes the only enabled graph action, transitioning the epoch to write
 *    phase. No explicit notification action exists. New ASSUME registers this
 *    as a declared abstraction boundary.
 *
 *  D21 — HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction:
 *    WF_vars(HookInterceptEs) and WF_vars(HookInterceptRg) are included in
 *    Fairness but no liveness property requires hook intercepts to fire.
 *    PipelineComplete accepts hookState="idle", so L1 witnesses can complete
 *    without any hook firing. The D8 comment acknowledged this limitation but
 *    did not follow the ASSUME documentation pattern established for D2–D18.
 *    New ASSUME formally registers this limitation.
 *
 *  D22 — PipelineCompleteAcceptsIdleHookIsDeclaredAbstraction:
 *    PipelineComplete accepts hookState ∈ {"idle","done","error"}, permitting
 *    pipeline completion with hookState="idle" — no hook intercept ever fired.
 *    No BDD scenario covers this path (all hook scenarios describe at least one
 *    intercept). This represents an under-specified BDD path, not a spec defect.
 *    New ASSUME formally registers this.
 *
 *  S33 generalized — GraphHaltCleanupPreservesMarkdown covers all 7 entry states:
 *    Prior form only verified the graphState="idle" entry case. ASSUME D12 claims
 *    markdownState UNCHANGED for ALL 7 active GraphHaltCleanup entry states
 *    (idle, collecting, building, dedup_error, retrying, force_dedup, writing).
 *    The six additional states — including the critical "writing" case — were
 *    unverified by any named property. S33 now uses the full entry-state set.
 *
 *  S34 — MarkdownStateMonotone (new):
 *    The R11 GraphWriteFail bug fix ensures markdownState never regresses from
 *    "stale" or "current" to "none", but this monotonicity guarantee had no
 *    named temporal property. A refactoring of GraphWriteFail or any other action
 *    that incorrectly set markdownState="none" when already "stale" or "current"
 *    would pass all S1–S33 properties without this invariant. S34 encodes the
 *    invariant directly: once markdownState reaches "stale" or "current", it
 *    never transitions back to "none".
 *
 *  L4b comment corrected:
 *    Prior comment claimed L4b "closes the full chain end-to-end." This was
 *    factually inaccurate: L4b's antecedent requires pipelineState="running",
 *    so the halted-during-dedup_error path is NOT covered by L4b — it is covered
 *    by L4 via GraphHaltCleanup (dedup_error → warn). Comment now accurately
 *    states L4b's scope: the running-pipeline dedup chain only.
 *
 * Revision 11 changes (debate objections — fifth session):
 *  R11 bug fix, D16–D18, S17/S27/S28/S29/S30/S31/S32/S33/L8, D8 comment.
 *  See Revision 11 header for details.
 *
 * Revision 10 changes (debate objections — fourth session PARTIAL_CONSENSUS):
 *  D8–D15. See Revision 10 header for details.
 *
 * Revision 9 changes (debate objections — third session PARTIAL_CONSENSUS):
 *  D1–D7. See Revision 9 header for details.
 *
 * Revision 8 changes (debate objections — second session):
 *  O1–O9 fully resolved. See Revision 8 header for details.
 *
 * Revision 7 changes (TLC fix — continued state space explosion):
 *  - PlainReadArrives/PlainReadComplete removed (toggle cycle root cause).
 *  - FindCmds={"find"}, GrepCmds={"grep"} reduced to 1 element each.
 *  - MaxAgents=1, MaxGraphOps=2, MaxRetries=1 in .cfg.
 *
 * Revision 6 changes (TLC fix — state space explosion / verification timeout):
 *  - MaxGraphOps constant and graphOpsCount variable added.
 *
 * Revision 5 changes (TLC fix — DuplicateEventuallyResolves liveness violation):
 *  - Consequent extended with "done" and "warn" for GraphHaltCleanup path.
 *
 * Revision 4 changes (TLC fix — GraphEventuallyFinishes liveness violation):
 *  - GraphHaltCleanup action added with WF_vars fairness.
 *
 * Revision 3 changes (TLC fix — temporal property violation):
 *  - pipelineState="running" guards added to graph add-actions and liveness.
 *
 * Revision 2 changes (per debate consensus):
 *  - graphEdges, pendingEdge, pendingKind added for symmetric edge dedup.
 *  - mappingEntryExists for distinct "valid role, missing mapping" failure.
 *  - markdownState replaces markdownWritten boolean.
 *  - agentsCompleted counter for multi-agent close-hook modeling.
 *
 * Derived from elicitor briefing and debate consensus (2026-04-16).
 *)

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxRetries,   \* Max dedup retry attempts per duplicate event
    MaxAgents,    \* Agents in the pipeline; each runs one close-hook write
    MaxGraphOps,  \* Max node/edge discovery ops per agent epoch
    NodePaths,    \* Set of possible node path identifiers (bounded)
    NULL,         \* Sentinel for "not set"
    InvalidRole,  \* A role value outside the valid enum
    \* --- Valid roles (model values) ---
    Elicitor, DocWriter, Expert, Moderator, Reviewer, CodeWriter,
    \* --- Valid models (model values) ---
    Opus, Sonnet, Haiku

(* Derived sets *)
Roles    == {Elicitor, DocWriter, Expert, Moderator, Reviewer, CodeWriter}
Models   == {Opus, Sonnet, Haiku}
AllRoles == Roles \cup {InvalidRole}
AllModels == Models \cup {NULL}

(*
 * Hook command classification.
 * FindCmds and GrepCmds are SINGLE-ELEMENT representative sets.
 * PlainCmds retained for S12 (PlainReadNeverIntercepted).
 *)
FindCmds  == {"find"}
GrepCmds  == {"grep"}
PlainCmds == {"get_content"}
SearchCmds  == FindCmds \cup GrepCmds
AllHookCmds == SearchCmds \cup PlainCmds

(*
 * Centralized role-to-model mapping.
 *)
RoleMapping ==
    (Elicitor   :> Opus)    @@
    (DocWriter  :> Sonnet)  @@
    (Expert     :> Sonnet)  @@
    (Moderator  :> Opus)    @@
    (Reviewer   :> Haiku)   @@
    (CodeWriter :> Sonnet)

-----------------------------------------------------------------------------
(*
 * Design ASSUME D3: Hook machine models a single-intercept cycle per pipeline run.
 *
 * hookState has no reset action from "done" or "error" back to "idle".
 * HookTerminalIsAbsorbing (S24) formally enforces this as a temporal safety
 * property verified by TLC.
 *
 * KNOWN DIVERGENCE FROM BDD (debate session 3, objection D3):
 * BDD documents two explicit scenarios — "Hook intercepts two sequential
 * file-search commands" and "Hook intercepts two sequential text-search
 * commands" — that assert hookState resets to ready-state between tool calls
 * within a single agent session. This TLA+ model does NOT model that reset.
 *
 * RESOLUTION: This model is a sound UNDER-APPROXIMATION of the real system.
 * It verifies the correctness of the single-intercept state machine path:
 * idle → intercepting → rewriting → {done, error}. The BDD multi-command
 * reset behavior is correct for the runtime and falls outside this model's
 * verification scope. A future refinement adding a HookReset action (with
 * appropriate fairness and liveness re-verification) would extend coverage
 * to multi-intercept paths. Until that refinement exists, all BDD multi-
 * command hook scenarios must be covered by integration tests, not by this
 * TLA+ model.
 *)
HookSingleUsePerPipelineRun == TRUE
ASSUME HookSingleUsePerPipelineRun

(*
 * Design ASSUME D2: retryCount increment-site is a declared abstraction.
 *
 * TLA+ increments retryCount in GraphRetry (the dedup_error → retrying
 * transition), so retryCount = 0 when the system first enters dedup_error.
 * BDD documents retryCount as 1-indexed: "first error sets retryCount=1"
 * (bdd.feature glossary, line ~36). No TLA+ state simultaneously encodes
 * graphState = "dedup_error" /\ retryCount = 1.
 *
 * RESOLUTION: The two models differ in counter offset at the dedup_error
 * entry point but are observationally equivalent at the force-dedup boundary:
 * both permit MaxRetries retry attempts before GraphForceDedup fires.
 * TLA+:  retryCount ∈ {0,1,...,MaxRetries-1} at dedup_error entry;
 *        force-dedup fires when retryCount >= MaxRetries (after MaxRetries
 *        increments in GraphRetry).
 * BDD:   retryCount ∈ {1,2,...,MaxRetries} at dedup_error entry;
 *        force-dedup fires at the (MaxRetries+1)th failure.
 * The boundary semantics are identical; only the labelling of the counter
 * at the intermediate state differs. This is a deliberate abstraction, not
 * a defect.
 *)
RetryCountIncrementSiteIsDeclaredAbstraction == TRUE
ASSUME RetryCountIncrementSiteIsDeclaredAbstraction

(*
 * Design ASSUME D7: GraphRetry path-substitution is a declared abstraction.
 *
 * GraphRetryNodeSuccess and GraphRetryEdgeSuccess model a retry as PATH
 * SUBSTITUTION: the pending item is replaced with a new non-duplicate path
 * selected from graphNodes. BDD models the retry as CALL REMOVAL: the
 * agent's duplicate discovery call is silently dropped and the agent is
 * notified so it can attempt a different path. Both models produce the same
 * observable outcome (the graph eventually accepts a non-duplicate entry),
 * but the internal mechanism differs. This abstraction is sound for verifying
 * the dedup retry state machine and the NoGhostEdges invariant. The real
 * removal-and-notify mechanism is enforced by the TypeScript implementation
 * and is outside this model's scope.
 *)
RetryPathSubstitutionIsDeclaredAbstraction == TRUE
ASSUME RetryPathSubstitutionIsDeclaredAbstraction

(*
 * Design ASSUME O5: Edge type is intentionally erased (declared abstraction).
 *
 * graphEdges stores <<from,to>> tuples only. Two edges with identical endpoints
 * but different types (e.g., "calls" vs "imports") are indistinguishable in
 * this model. This is SOUND for verifying the dedup state machine (type-agnostic)
 * and the NoGhostEdges safety property (endpoint membership). The BDD permits
 * parallel typed edges between the same node pair as distinct entities; this
 * model over-constrains edge dedup in that case. Typed-edge type validation is
 * enforced by the TypeScript wrapper and is outside this model's scope.
 *)
EdgeTypeErasureIsDeclaredAbstraction == TRUE
ASSUME EdgeTypeErasureIsDeclaredAbstraction

(*
 * Design ASSUME D9: PlainCmds command-name normalization is a declared abstraction.
 *
 * PlainCmds = {"get_content"} is a lowercase representative value used for
 * S12 (PlainReadNeverIntercepted). The BDD's canonical form is "Get-Content"
 * (PowerShell PascalCase). No real PreToolUse hook produces the string
 * "get_content"; S12 therefore verifies a safety property about a command
 * string that does not appear in the real system.
 *
 * RESOLUTION: This normalization is intentional and sound. S12's semantic
 * claim is: the hook classification logic never intercepts plain file reads.
 * The specific string used as a representative is an abstraction boundary;
 * the real enforcement is the hook's pattern-matching logic (TypeScript
 * implementation). "get_content" serves as an unambiguous model value that
 * does not overlap with FindCmds or GrepCmds, preserving S12's role as a
 * classification-boundary invariant. The real Get-Content command-string
 * matching is tested at the integration level, not by this TLA+ model.
 *)
PlainCmdNormalizationIsDeclaredAbstraction == TRUE
ASSUME PlainCmdNormalizationIsDeclaredAbstraction

(*
 * Design ASSUME D10: Config failure mode collapse is a declared abstraction.
 *
 * BDD specifies three distinct failure modes for config loading:
 *   (1) Missing mapping entry — valid role, no entry in config/model-routing.psd1
 *   (2) Config file missing entirely — file not found at expected path
 *   (3) Malformed config file — file present but invalid PowerShell data syntax
 *
 * TLA+ collapses all three into the single boolean mappingEntryExists=FALSE.
 * The MappingLookupFail action fires for all three cases. No type information
 * distinguishes which failure mode occurred.
 *
 * RESOLUTION: This collapse is sound for verifying the routing state machine:
 * all three failure modes share the same observable outcome (routingState="error",
 * pipelineState="halted"). The semantic distinction between failure modes (error
 * message content, recovery instructions) is enforced by the PowerShell
 * implementation and tested at the integration level, not by this TLA+ model.
 * Future refinement could add a failureKind variable, but it would not change
 * any currently verified safety or liveness property.
 *)
ConfigFailureModeCollapseIsDeclaredAbstraction == TRUE
ASSUME ConfigFailureModeCollapseIsDeclaredAbstraction

(*
 * Design ASSUME D11: Pre-output hook crash and tsx hang are out-of-scope.
 *
 * BDD has two explicit scenarios with no TLA+ counterpart:
 *
 *   (a) Pre-output crash — "hook script itself exits with non-zero code before
 *       producing output." This is a crash that occurs BEFORE the rewrite step.
 *       HookExecuteFail requires hookRewritten=TRUE (the rewrite succeeded, then
 *       execution of the rewritten command failed). The pre-output crash path,
 *       where hookRewritten remains FALSE when the error fires, has no TLA+ action.
 *
 *   (b) tsx hang / timeout — "tsx process does not exit within the configured
 *       close-hook timeout." No timeout action or timeout variable exists in this
 *       model. The close-hook timeout enforcement mechanism (kill tsx, log WARN,
 *       continue) is not modeled.
 *
 * RESOLUTION: Both behaviors are declared out-of-scope for this TLA+ model.
 * The hook state machine modeled here covers only the successful-intercept and
 * post-rewrite-failure paths (idle → intercepting → rewriting → {done, error}).
 * Pre-rewrite crash behavior (rewritten=FALSE at error) and timeout/abort
 * behavior are enforced by the PowerShell/TypeScript runtime and must be
 * covered by integration tests against those implementations.
 *)
PreOutputCrashAndTimeoutAreOutOfScope == TRUE
ASSUME PreOutputCrashAndTimeoutAreOutOfScope

(*
 * Design ASSUME D12: GraphHaltCleanup "warn" conflation is a declared abstraction.
 *
 * GraphHaltCleanup fires when pipelineState="halted" and graphState is any
 * active state (idle, collecting, building, dedup_error, retrying, force_dedup,
 * writing). It unconditionally sets graphState="warn" regardless of whether a
 * write was ever attempted. This conflates:
 *   (a) Pipeline-abort-before-write: graphState was "idle" or "collecting";
 *       no write occurred; CLAUDE.md is unchanged.
 *   (b) Write-failure: graphState was "writing"; a write was attempted and
 *       failed; CLAUDE.md may be stale or absent.
 *
 * BDD defines graphState="warn" exclusively as condition (b): GraphWriteFail
 * sets graphState="warn" after a write attempt fails. Condition (a) has no
 * dedicated terminal state name in the BDD.
 *
 * RESOLUTION: This conflation is a deliberate under-specification. Both
 * conditions share the observable terminal behavior (pipeline continues, [WARN]
 * log entry, stale or absent CLAUDE.md persists). A finer model could introduce
 * graphState="aborted" for pipeline-abort-without-write, but this would not
 * change any currently verified safety or liveness property, since PipelineComplete
 * already accepts graphState ∈ {"done","warn"} and GraphTerminalClean (S16)
 * applies to both states. The behavioral distinction is enforced by the
 * PowerShell implementation's cleanup logic and tested at the integration level.
 *
 * NOTE: markdownState is in UNCHANGED for GraphHaltCleanup (all entry states).
 * S33 (GraphHaltCleanupPreservesMarkdown) formally verifies this for all 7
 * active entry states — including the "writing" case, which is the most critical
 * since it distinguishes abort-during-write from GraphWriteFail.
 *
 * EPOCH-RELATIVE FRESHNESS GAP (Revision 20 — O-9 fix):
 * markdownState = "current" in TLA+ records that a write succeeded; it does NOT
 * encode which epoch the write corresponds to. Consider a two-agent pipeline
 * (MaxAgents=2) where epoch 1 completes successfully (markdownState="current")
 * and epoch 2 begins discovery but the pipeline halts before GraphWriteMarkdown
 * fires. GraphHaltCleanup sets graphState="warn" with markdownState UNCHANGED —
 * markdownState remains "current", but CLAUDE.md reflects only epoch 1 data.
 * Epoch 2 discoveries are lost with no markdown signal distinguishing this case
 * from a fully-current (both epochs written) terminal state.
 *
 * A formal GraphMarkdownFreshness property would require an explicit epoch counter
 * variable and a function mapping markdownState="current" to a specific epoch
 * number — variables absent from this model. Introducing them would substantially
 * expand the state space without changing any currently verified safety property.
 *
 * RESOLUTION: The epoch-relative freshness limitation is declared here rather than
 * modeled formally. The runtime consequence — that "current" does not distinguish
 * fully-written from partially-written multi-epoch runs — is an implementation
 * concern. Compensating integration test: for a MaxAgents=2 pipeline, verify that
 * markdownState at terminal state accurately reflects which epochs completed
 * successfully (i.e., a two-agent run halted during epoch 2 leaves CLAUDE.md
 * with only epoch 1 content, and tests confirm this by inspecting file content,
 * not by relying on markdownState alone).
 *)
GraphHaltCleanupWarnConflationIsDeclaredAbstraction == TRUE
ASSUME GraphHaltCleanupWarnConflationIsDeclaredAbstraction

(*
 * Design ASSUME D14: GraphWriteMarkdown requires graphState="collecting".
 *
 * Prior to Revision 10, GraphWriteMarkdown's guard included graphState="idle",
 * permitting a path where agentsCompleted reaches MaxAgents and graphState reaches
 * "done"/"warn" without GraphStartCollecting ever firing — bypassing the graph
 * discovery phase entirely. No BDD scenario covers a pipeline run where the close
 * hook fires before any graph discovery begins (graphState remained "idle").
 *
 * RESOLUTION: GraphWriteMarkdown is now guarded on graphState="collecting" only.
 * GraphStartCollecting has WF_vars fairness; it will always fire (transitioning
 * idle → collecting) before GraphWriteMarkdown can be enabled. This makes the
 * model faithful to the BDD invariant that a close-hook write occurs only after
 * at least one collection epoch has been initiated. The pipeline-abort path
 * (pipelineState="halted" while graphState="idle") is still handled correctly
 * by GraphHaltCleanup, which fires independently of GraphWriteMarkdown.
 *)
GraphWriteMarkdownRequiresCollecting == TRUE
ASSUME GraphWriteMarkdownRequiresCollecting

(*
 * Design ASSUME D16: Role value normalization is a declared abstraction.
 *
 * DocWriter and CodeWriter are TLA+ model values that represent the BDD's
 * hyphenated role strings "doc-writer" and "code-writer" respectively. TLA+
 * model values cannot contain hyphens, so the hyphen is silently dropped in
 * the TLA+ representation. This normalization is consistent across all actions
 * that reference these role values (StartPipeline nondeterminism, RoleMapping,
 * ValidateRoleSuccess guard).
 *
 * RESOLUTION: The normalization is intentional and sound. The RoleMapping
 * function correctly maps DocWriter → Sonnet and CodeWriter → Sonnet, matching
 * the BDD specification's "doc-writer→sonnet" and "code-writer→sonnet" entries.
 * The hyphenated string matching is enforced by the PowerShell implementation's
 * role validation logic and tested at the integration level, not by this TLA+
 * model. This ASSUME documents the sole case where a constant name deviates
 * from its BDD string representation.
 *)
RoleValueNormalizationIsDeclaredAbstraction == TRUE
ASSUME RoleValueNormalizationIsDeclaredAbstraction

(*
 * Design ASSUME D17: graphOpsCount excludes retry cycle ops (declared abstraction).
 *
 * graphOpsCount is incremented only by GraphAddNode and GraphAddEdge — the
 * actions that initiate a new discovery op. The following retry-path actions do
 * NOT increment graphOpsCount:
 *   GraphRetry, GraphRetryNodeSuccess, GraphRetryEdgeSuccess,
 *   GraphRetryNodeStillDuplicate, GraphRetryEdgeStillDuplicate,
 *   GraphForceDedup, GraphAfterForceDedup.
 *
 * Consequence: an epoch can execute exactly MaxGraphOps add-ops, each of which
 * may trigger an unbounded number of retry cycles, while graphOpsCount remains
 * bounded by MaxGraphOps. The retry budget (MaxRetries) is tracked separately
 * by retryCount and is scoped per dedup cycle, not per epoch.
 *
 * RESOLUTION: This exclusion is intentional. The graphOpsCount bound prevents
 * the state space from exploding due to unbounded collection epochs (L5 /
 * GraphEventuallyFinishes). Retry cycles are already bounded by MaxRetries via
 * GraphForceDedup. Counting retry ops in graphOpsCount would prematurely cap
 * collection epochs and misrepresent the real system's behavior, where retries
 * consume agent-level budget (not epoch-level ops).
 *)
GraphOpsCountExcludesRetryBudget == TRUE
ASSUME GraphOpsCountExcludesRetryBudget

(*
 * Design ASSUME D18: Crash-free execution is a declared abstraction.
 *
 * agentsCompleted is initialized to 0 in Init and incremented monotonically by
 * GraphWriteSuccess and GraphWriteFail. It has no durability guarantee: if the
 * pipeline runner crashes and restarts, Init resets agentsCompleted to 0,
 * causing previously completed close-hook writes to be invisible to the new run.
 *
 * Unlike PreOutputCrashAndTimeoutAreOutOfScope (D11), which declares hook-level
 * crash behavior out of scope, this ASSUME addresses the pipeline-level
 * assumption that underlies agentsCompleted's correctness as a completion counter.
 *
 * RESOLUTION: This model assumes the pipeline runner executes exactly one
 * complete run without crashing between Init and terminal state. Crash-recovery,
 * checkpoint/restart, and partial-completion persistence are outside this model's
 * verification scope. The correctness of agentsCompleted across multiple runs or
 * partial runs is enforced by the TypeScript/PowerShell runtime's process
 * management and tested at the integration level.
 *)
CrashFreeExecutionIsDeclaredAbstraction == TRUE
ASSUME CrashFreeExecutionIsDeclaredAbstraction

(*
 * Design ASSUME D19: StillDuplicate retryCount inheritance is a declared
 * abstraction.
 *
 * GraphRetryNodeStillDuplicate and GraphRetryEdgeStillDuplicate re-enter
 * dedup_error with retryCount UNCHANGED — the counter inherited from the prior
 * GraphRetry increment. BDD implies fresh-cycle semantics: each substitute path
 * that is also a duplicate begins a new retry cycle with retryCount=0 at
 * dedup_error entry.
 *
 * TLA+ model behavior: retryCount is a SHARED budget that exhausts across all
 * substitute-path attempts for a single original item. If the agent submits a
 * substitute that is also a duplicate, the prior GraphRetry increment is
 * retained, moving the counter closer to MaxRetries (and therefore
 * GraphForceDedup) without resetting.
 *
 * RESOLUTION: The shared-budget model is MORE CONSERVATIVE than the BDD's
 * per-cycle model. It provides a stronger liveness guarantee: the dedup machine
 * reaches force_dedup in at most MaxRetries total substitute attempts, regardless
 * of how many substitutes were tried and re-rejected. A per-cycle reset would
 * permit infinite substitution loops if every substitute were also a duplicate.
 * The shared budget is the sound choice for termination verification. This
 * divergence from BDD fresh-cycle semantics is intentional and does not affect
 * any safety property; it only strengthens the termination bound. The real
 * system's per-cycle behavior is enforced by the TypeScript implementation and
 * tested at the integration level.
 *)
StillDuplicateRetryCountInheritanceIsDeclaredAbstraction == TRUE
ASSUME StillDuplicateRetryCountInheritanceIsDeclaredAbstraction

(*
 * Design ASSUME D20: MaxGraphOps silent epoch boundary is a declared abstraction.
 *
 * When graphOpsCount = MaxGraphOps, GraphAddNode and GraphAddEdge are silently
 * disabled — no notification action exists. The BDD scenario "graphOpsCount at
 * MaxGraphOps boundary" asserts the system does not silently drop the add-operation
 * without notifying the agent. These specifications are in apparent contradiction.
 *
 * RESOLUTION: In TLA+, reaching the MaxGraphOps boundary is not a "silent drop."
 * With graphOpsCount = MaxGraphOps and pendingKind = "none", GraphWriteMarkdown
 * becomes the only enabled graph action. The epoch completes deterministically
 * by transitioning to "writing" state. From the agent's perspective, the epoch
 * boundary is observable: the write phase begins, close-hook fires, and the
 * next epoch starts with graphOpsCount=0. No in-band notification action is
 * needed because epoch completion is itself the signal.
 *
 * The BDD's "notification" requirement is an implementation-level concern
 * (the TypeScript runtime logging an epoch-full message) rather than a state
 * machine property. This TLA+ model captures the epoch-boundary transition
 * semantics correctly at the state machine level. The notification mechanism
 * is enforced by the TypeScript implementation and tested at the integration
 * level, not by this TLA+ model.
 *)
MaxGraphOpsSilentEpochBoundaryIsDeclaredAbstraction == TRUE
ASSUME MaxGraphOpsSilentEpochBoundaryIsDeclaredAbstraction

(*
 * Design ASSUME D21: WF for HookInterceptEs/Rg without exercising liveness
 * property is a declared abstraction.
 *
 * WF_vars(HookInterceptEs) and WF_vars(HookInterceptRg) are included in Fairness.
 * These conditions ensure that if these actions are continuously enabled, TLC
 * must eventually take them. However, NO named liveness property (L1–L8) requires
 * hook intercepts to fire in a valid witness trace. PipelineComplete accepts
 * hookState="idle" (see ASSUME D22), so L1 (PipelineTerminates) witnesses can
 * complete without any hook intercept ever firing — the pipeline starts, routes,
 * collects graph data, and completes with hookState="idle" throughout. WF is
 * trivially discharged for these paths once pipelineState becomes terminal.
 *
 * These fairness conditions do NOT force TLC to find witnesses that exercise
 * hook intercept paths; they only prevent TLC from ignoring hook intercepts
 * on paths where the hooks are continuously enabled and the pipeline is running.
 * Integration tests must cover hook intercept scenarios end-to-end.
 *
 * The D8 comment in prior revisions acknowledged this limitation but did not
 * follow the ASSUME documentation pattern established for D2–D18. This ASSUME
 * formally registers the limitation for auditability.
 *)
HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction == TRUE
ASSUME HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction

(*
 * Design ASSUME D22: PipelineComplete accepting hookState="idle" is a declared
 * abstraction.
 *
 * PipelineComplete accepts hookState ∈ {"idle", "done", "error"}, permitting
 * pipeline completion when no hook intercept ever fired (hookState remained
 * "idle" throughout). No BDD scenario explicitly covers this path: all BDD hook
 * scenarios describe a run where the hook intercepts at least one search command.
 *
 * RESOLUTION: This is an under-specified BDD path, not a spec defect. Hooks fire
 * only when agents issue search commands (find, grep, etc.). A pipeline run where
 * no agent issues a search command — legitimately possible for agents that only
 * read files or call non-search tools — should complete normally without any hook
 * intercept. Blocking PipelineComplete on hookState="done" would incorrectly
 * require every pipeline run to intercept at least one search command, violating
 * the BDD principle that hook behavior is transparent to agents.
 *
 * The absence of a BDD scenario for the no-intercept path is a BDD coverage gap,
 * not a design defect. Integration tests should add a scenario verifying that a
 * pipeline run with no search commands completes normally.
 *)
PipelineCompleteAcceptsIdleHookIsDeclaredAbstraction == TRUE
ASSUME PipelineCompleteAcceptsIdleHookIsDeclaredAbstraction

(*
 * Design ASSUME D23: Invalid model strings are unmodeled — declared abstraction.
 *
 * AllModels = Models ∪ {NULL} = {Opus, Sonnet, Haiku, NULL}. Invalid model
 * strings such as "gpt-4" or "claude-opus-99" cannot be selected by
 * StartPipeline's nondeterminism (\E model \in AllModels). BDD Revision 3 added
 * two explicit scenarios asserting pipeline halt on invalid model values:
 *
 *   (a) "Config mapping entry resolves to model string outside the valid enum"
 *   (b) "Explicit Model override parameter with value outside the valid enum"
 *
 * Neither path is reachable in TLA+. ResolveModel's override branch guards
 *   inputModel /= NULL /\ inputModel ∈ Models
 * so an out-of-enum override can never satisfy that guard. The "config mapping
 * resolves to out-of-enum model" path would require RoleMapping to return an
 * invalid value, which is structurally impossible because RoleMapping is a
 * function into Models. No ASSUME documented this gap in Revisions 1–12,
 * violating the ASSUME discipline established by D2–D22.
 *
 * RESOLUTION: Introducing an InvalidModel constant (analogous to InvalidRole)
 * would require new routing actions to detect and reject it, significantly
 * expanding the state space without improving the verified properties. The two
 * BDD scenarios are enforced by the PowerShell implementation's parameter
 * validation (ValidateSet attribute on $Model; RoleMapping .psd1 schema
 * validation) and must be covered by integration tests, not by this TLA+
 * model.
 *)
InvalidModelStringsUnmodeledIsDeclaredAbstraction == TRUE
ASSUME InvalidModelStringsUnmodeledIsDeclaredAbstraction

(*
 * Design ASSUME D24: NULL inputRole path is structurally unreachable —
 * declared abstraction.
 *
 * StartPipeline assigns inputRole from \E role \in AllRoles, where
 *   AllRoles = Roles ∪ {InvalidRole}.
 * NULL is not in AllRoles. After StartPipeline fires, inputRole is never
 * NULL. There is therefore no reachable state where
 *   routingState = "validating" /\ inputRole = NULL.
 *
 * BDD has an explicit halt scenario: "Role parameter is required — halts
 * when no Role parameter passed." This requires the system to detect a
 * NULL/missing role and halt the pipeline. This path is structurally
 * unreachable in TLA+, and no ASSUME documented this gap in Revisions 1–12.
 *
 * RESOLUTION: In the real system, NULL/missing-role detection is a
 * pre-state-machine parameter check that occurs before the routing state
 * machine starts (PowerShell [Parameter(Mandatory)] attribute on $Role).
 * Modeling it would require either:
 *   (a) A new ValidateRoleNotProvided action guarded on inputRole = NULL, or
 *   (b) Extending AllRoles to include NULL (disrupting ValidateRoleSuccess's
 *       inputRole ∈ Roles guard and requiring a new fail action).
 * Both approaches expand the model without changing any currently verified
 * safety or liveness property. The NULL-role check is enforced by the
 * PowerShell implementation and must be covered by integration tests.
 *
 * NOTE: The TLA+ Init state has inputRole = NULL, but StartPipeline fires
 * atomically and assigns a non-NULL role before routingState changes. The
 * NULL value in Init represents "pipeline not yet started", not "role
 * parameter not provided". These are semantically distinct conditions;
 * only the latter corresponds to the BDD scenario.
 *)
NullInputRoleStructurallyUnreachableIsDeclaredAbstraction == TRUE
ASSUME NullInputRoleStructurallyUnreachableIsDeclaredAbstraction

(*
 * Design ASSUME D25: External pipeline abort signal is unmodeled — declared abstraction.
 *
 * BDD scenario B2 describes pipelineState transitioning to "halted" from an
 * external abort signal (e.g., Ctrl-C, process termination, or an upstream
 * orchestrator sending a kill signal). In TLA+, pipelineState="halted" is set
 * exclusively by two routing actions:
 *   - ValidateRoleFail   (routingState = "validating" /\ inputRole \notin Roles)
 *   - MappingLookupFail  (routingState = "resolving"  /\ mappingEntryExists = FALSE)
 *
 * Consequently, S6 (HaltedMeansRoutingError) holds unconditionally: every
 * reachable pipelineState="halted" state is co-located with routingState="error".
 * This is structurally enforced — no action can set pipelineState="halted" without
 * also setting routingState="error". The BDD's externally-triggered abort path
 * produces pipelineState="halted" from any pipeline state, including "running" with
 * routingState="invoking" or "done", which would violate S6.
 *
 * RESOLUTION: External abort signal handling — process signals, orchestrator kills,
 * timeout-triggered halts — is outside the routing state machine modeled here. The
 * TLA+ model verifies correctness of the routing-originated halt path only. S6
 * (HaltedMeansRoutingError) is therefore a structural property of this model, not a
 * universal claim about the real system. The external abort scenario is enforced by
 * the PowerShell/TypeScript runtime's signal handling and tested at the integration
 * level, not by this TLA+ model.
 *)
ExternalPipelineAbortIsUnmodeledAbstraction == TRUE
ASSUME ExternalPipelineAbortIsUnmodeledAbstraction

(*
 * Design ASSUME D26: Two-phase atomic write collapse is a declared abstraction.
 *
 * BDD documents a two-phase write mechanism for CLAUDE.md update:
 *   Phase 1 — Write to temp file (e.g., CLAUDE.md.tmp)
 *   Phase 2 — Rename temp file to CLAUDE.md (atomic rename)
 *
 * BDD further defines a distinct failure scenario: rename failure after a
 * successful temp-file write — the temp file exists but the rename fails (e.g.,
 * due to a locked file, permission error, or cross-device rename). This produces
 * a distinct observable state: temp file present, CLAUDE.md unchanged.
 *
 * TLA+ collapses both phases into the single GraphWriteMarkdown action
 * (graphState: "collecting" → "writing"), followed by GraphWriteSuccess or
 * GraphWriteFail. There is no rename-failure action and no temp-file variable.
 * The "writing" state abstracts over both phases atomically. A rename failure is
 * indistinguishable from GraphWriteFail at this level of abstraction: both produce
 * markdownState ∈ {"none","stale"} and graphState="warn".
 *
 * RESOLUTION: The two-phase write is an implementation-level concern. The atomic
 * GraphWriteMarkdown → {GraphWriteSuccess, GraphWriteFail} model correctly captures
 * the observable outcomes (CLAUDE.md updated vs. CLAUDE.md unchanged/stale) without
 * modeling the internal mechanism. The temp-file mechanism and rename-failure
 * recovery are enforced by the PowerShell implementation's file-write helper and
 * tested at the integration level, not by this TLA+ model.
 *
 * INTER-AGENT CONCURRENT WRITE RACE (Revision 20 — O-6 fix):
 * D26's scope is PER-AGENT: each agent's close hook write is modeled as a single
 * sequential action sequence (GraphWriteMarkdown → GraphWriteSuccess/GraphWriteFail).
 * TLA+ actions are atomic steps — no two actions fire simultaneously. Consequently,
 * the inter-agent concurrent write race is structurally unmodeled:
 *
 *   Real scenario: Agent A's tsx process and Agent B's tsx process both reach
 *   the rename step simultaneously. One succeeds; the other fails with EEXIST,
 *   EACCES, or a cross-device rename error. The "winning" agent's CLAUDE.md write
 *   reflects its discoveries; the "losing" agent's write is lost without retry.
 *
 *   TLA+ model: GraphWriteSuccess and GraphWriteFail for distinct agents are
 *   serialized by TLC's state-transition model. No simultaneous rename action exists.
 *   The "losing agent" scenario has no TLA+ counterpart.
 *
 * This gap is NOT covered by D31 (MaxAgents=1 scope) because the race requires
 * MaxAgents >= 2 to be observable. Even with the TokenSaving-MultiAgent.cfg
 * (MaxAgents=2), the sequential action model cannot exercise simultaneous renames.
 *
 * RESOLUTION: The inter-agent rename race is an OS-level concurrency concern
 * outside this TLA+ model's scope. Compensating integration test: run a two-agent
 * pipeline and inject a deliberate rename race (via filesystem mock or timing
 * injection) to confirm that the losing agent's error is surfaced and the pipeline
 * continues with the winning agent's CLAUDE.md content.
 *)
TwoPhaseWriteCollapseIsDeclaredAbstraction == TRUE
ASSUME TwoPhaseWriteCollapseIsDeclaredAbstraction

(*
 * Design ASSUME D27: Hook actions completing after pipeline halt is an intentional
 * unguarded design choice — declared abstraction.
 *
 * HookRewrite, HookExecuteSuccess, and HookExecuteFail do not guard on
 * pipelineState="running". A concurrent ValidateRoleFail or MappingLookupFail can
 * set pipelineState="halted" while hookState="intercepting", allowing the hook
 * state machine to continue advancing:
 *   - HookRewrite fires:        hookState "intercepting" → "rewriting"
 *   - HookExecuteSuccess fires: hookState "rewriting"    → "done"
 *   - HookExecuteFail fires:    hookState "rewriting"    → "error"
 * These transitions proceed even after pipelineState="halted".
 *
 * Compare: HookInterceptEs and HookInterceptRg DO guard on pipelineState="running",
 * preventing NEW intercepts after pipeline halt. Only in-progress intercepts
 * (hookState="intercepting" or "rewriting") are permitted to complete.
 *
 * RESOLUTION: This design is intentional. Intercepted commands that are mid-execution
 * when a routing failure fires should complete their rewrite cycle rather than be
 * abandoned mid-intercept, which would leave the calling agent with an undefined
 * response. The hook state machine is designed to run to its own terminal state
 * independently of pipelineState. Adding pipelineState="running" guards to
 * HookRewrite/HookExecuteSuccess/HookExecuteFail would require additional cleanup
 * actions (analogous to GraphHaltCleanup) to handle hook abortion on pipeline halt,
 * significantly complicating the model without improving verified properties.
 * The observable consequence — hookState="done" or "error" with pipelineState=
 * "halted" — is covered by HookErrorHaltedIsJointlyAbsorbing (S26) and
 * HookErrorAllowsCompletion (S17).
 *
 * INTEGRATION TEST INJECTION MECHANISM (Revision 20 — O-7 fix):
 * Integration tests verifying this behavior must simulate the following four-step
 * action interleaving sequence. Without this specification, two engineers may write
 * incompatible tests (e.g., one using a mock halt signal injected before step 1,
 * another using an artificial delay between steps 2 and 3).
 *
 *   Step 1: HookInterceptEs or HookInterceptRg fires.
 *           Pre-state:  hookState="idle", pipelineState="running"
 *           Post-state: hookState="intercepting", hookCommand∈{FindCmds∪GrepCmds}
 *
 *   Step 2: ValidateRoleFail or MappingLookupFail fires (routing failure).
 *           Pre-state:  hookState="intercepting", pipelineState="running"
 *           Post-state: pipelineState="halted", routingState="error"
 *           (hookState remains "intercepting" — routing failure does not abort hook)
 *
 *   Step 3: HookRewrite fires.
 *           Pre-state:  hookState="intercepting", pipelineState="halted"
 *           Post-state: hookState="rewriting", hookRewritten=TRUE
 *
 *   Step 4: HookExecuteSuccess or HookExecuteFail fires.
 *           Pre-state:  hookState="rewriting", pipelineState="halted"
 *           Post-state: hookState∈{"done","error"}
 *
 * The test must assert: after step 4, hookState is "done" or "error" — confirming
 * hook completion proceeds to its terminal state despite pipelineState="halted"
 * at step 2. The test must NOT inject a halt signal before step 1 (that would
 * prevent hook initiation entirely, since HookInterceptEs/Rg guard pipelineState=
 * "running"). The halt must be injected between steps 1 and 3 (after intercept
 * begins, before rewrite completes).
 *)
HookActionsCompleteAfterHaltIsDeclaredAbstraction == TRUE
ASSUME HookActionsCompleteAfterHaltIsDeclaredAbstraction

(*
 * Design ASSUME D28: Hook evaluation order and sequential delegation chain
 * are declared abstractions.
 *
 * The real vibe-cli hook configuration (monorepo .claude/settings.json) lists
 * hook scripts as an ordered array. Evaluation order is deterministic:
 * es-hook.ps1 (array index 0) fires before rg-hook.ps1 (array index 1).
 * Each script runs to completion before the next fires — a sequential delegation
 * chain. No two hooks execute concurrently for the same tool call.
 *
 * TLA+ models HookInterceptEs and HookInterceptRg as non-deterministic
 * alternatives from hookState="idle" with no ordering constraint between them.
 * The model does not distinguish "es fires first" from "rg fires first" traces.
 * The single-intercept machine (hookState="idle" → "intercepting" is a single
 * transition) precludes concurrent intercepts but does not encode the sequential
 * delegation ordering.
 *
 * RESOLUTION: The ordering guarantee (es before rg) and sequential delegation
 * chain are enforced by the Claude Code hook runtime's array-ordered evaluation.
 * The non-deterministic model is a sound over-approximation: verifying both
 * orderings is strictly stronger than verifying only the es-first order. All
 * safety and liveness properties hold regardless of which hook fires. Integration
 * tests must cover ordered evaluation behaviour end-to-end.
 *)
HookEvaluationOrderAndDelegationChainIsDeclaredAbstraction == TRUE
ASSUME HookEvaluationOrderAndDelegationChainIsDeclaredAbstraction

(*
 * Design ASSUME D29: B7 identity-override code path is a declared abstraction.
 *
 * BDD scenario B7 documents an identity-override case: when the caller supplies
 * an explicit $Model override that equals the role's centrally-mapped model
 * (e.g., role=Elicitor maps to Opus and $Model=Opus is also supplied), the
 * override is accepted and the same model is used — no short-circuit branch,
 * no special-case behaviour. The observable outcome is identical to a non-override
 * run with that role: resolvedModel = RoleMapping[inputRole] = inputModel.
 *
 * In TLA+, ResolveModel selects inputModel when inputModel /= NULL /\ inputModel \in Models
 * without testing whether inputModel = RoleMapping[inputRole]. The identity-override
 * scenario is structurally reachable — StartPipeline's nondeterminism can choose
 * inputModel = RoleMapping[inputRole] — but no named property distinguishes this
 * path from any other valid-override path.
 *
 * BDD B7 is documented only as a Gherkin scenario comment, not as a formal TLA+
 * ASSUME, INVARIANT, or PROPERTY. This is a gap in the D2–D27 ASSUME discipline.
 *
 * RESOLUTION: The identity-override case produces the same state-machine outcome
 * as any other valid override (routingState="invoking", resolvedModel \in Models).
 * S7 (ResolvedModelValid) and L2 (ValidRoleLeadsToModel) cover all override paths
 * uniformly. The identity-override is an implementation-level test concern,
 * fully covered by the PowerShell parameter-binding tests at the integration level.
 *)
IdentityOverrideCodePathGapIsDeclaredAbstraction == TRUE
ASSUME IdentityOverrideCodePathGapIsDeclaredAbstraction

(*
 * Design ASSUME D30: Dedup-error notification payload is unmodeled —
 * declared abstraction.
 *
 * BDD specifies that when graphState enters "dedup_error", a notification is
 * sent to the agent containing two payload fields:
 *   (a) The duplicate path that triggered the error — the value of pendingNode
 *       or pendingEdge at dedup_error entry.
 *   (b) The current retryCount value at dedup_error entry.
 *
 * TLA+ has no notification variable and no message-passing mechanism. The
 * dedup_error state encodes only the presence of a duplicate error; it does not
 * model the outbound payload sent to the agent. ASSUME D7 (RetryPathSubstitution
 * IsDeclaredAbstraction) covers how the agent responds to the notification — via
 * path substitution — but D7 does not address the notification payload content.
 *
 * Note: both payload fields are observable from TLA+ state variables (pendingNode
 * or pendingEdge, and retryCount) but the delivery mechanism (the notification
 * action itself) is absent from the model.
 *
 * RESOLUTION: Introducing a notificationPayload variable would require modelling
 * message delivery, payload formatting, and agent consumption — all outside the
 * dedup state machine's correctness scope. Payload content and delivery are
 * enforced by the TypeScript runtime and tested at the integration level.
 *)
DedupErrorNotificationPayloadIsUnmodeled == TRUE
ASSUME DedupErrorNotificationPayloadIsUnmodeled

(*
 * Design ASSUME D31: MaxAgents=1 model-checking scope is a declared abstraction.
 *
 * The .cfg sets MaxAgents=1. Under this constraint TLC verifies only single-agent
 * pipeline traces. The multi-epoch "collecting" return branch of GraphWriteSuccess
 * and GraphWriteFail — the ELSE "collecting" arm taken when agentsCompleted + 1 < MaxAgents —
 * is never executed, because agentsCompleted + 1 = 1 = MaxAgents is always true
 * with MaxAgents=1, causing the terminal "done"/"warn" branch to fire exclusively.
 *
 * Increasing MaxAgents to 2 significantly expands the state space (graphNodes and
 * graphEdges can grow across two epochs). NodePaths={p1,p2} with MaxAgents=2 was
 * not verified in Revisions 1–15 due to state-space concerns.
 *
 * The following five properties are unverified for multi-agent (MaxAgents > 1)
 * scenarios. Each entry records: (1) why it is unverified, (2) the boundary
 * condition that separates the verified and unverified regions, and (3) the
 * compensating test that covers the gap outside TLC.
 *
 *   S25 (PipelineCompletionRequiresAllAgents):
 *     (1) Why unverified: With MaxAgents=1, the first write event always satisfies
 *         agentsCompleted + 1 >= MaxAgents, so the terminal branch fires immediately.
 *         TLC never reaches a state where agentsCompleted + 1 < MaxAgents and the
 *         pipeline must wait for additional agents.
 *     (2) Boundary: MaxAgents = 1 means the "all agents completed" guard is
 *         trivially discharged after one write. For MaxAgents > 1, the inductive
 *         case (increment-before-terminal, no skip) is structurally enforced by
 *         the action definitions but is never exercised by TLC.
 *     (3) Compensating test: Integration tests with MaxAgents=3 pipelines verify
 *         that PipelineComplete is blocked until agentsCompleted reaches MaxAgents.
 *
 *   S30 (GraphNodesMonotone):
 *     (1) Why unverified: TLC explores only the single-epoch path. The monotonicity
 *         guarantee across multiple epochs — that graphNodes never shrinks between
 *         the end of epoch N and the start of epoch N+1 — requires at least two
 *         complete epochs (MaxAgents >= 2) to exercise the cross-epoch accumulation.
 *     (2) Boundary: With MaxAgents=1, graphNodes can only grow within a single
 *         epoch before GraphWriteSuccess/GraphWriteFail resets graphState to "done"
 *         or "warn" (never back to "collecting"). The second-epoch re-entry path
 *         through GraphWriteSuccess→"collecting" is structurally unreachable.
 *     (3) Compensating test: Integration tests with sequential multi-agent runs
 *         inspect the CLAUDE.md node set after each agent epoch to confirm no
 *         previously accepted nodes are absent in the subsequent write.
 *
 *   S31 (GraphEdgesMonotone):
 *     (1) Why unverified: Same as S30 — cross-epoch edge accumulation requires
 *         at least two complete epochs. TLC never exercises the second-epoch path.
 *     (2) Boundary: Identical to S30: the GraphWriteSuccess→"collecting" return
 *         branch is structurally unreachable under MaxAgents=1.
 *     (3) Compensating test: Same multi-agent integration test suite as S30;
 *         edge counts in CLAUDE.md are checked for monotone growth across epochs.
 *
 *   L4 (DuplicateEventuallyResolves):
 *     (1) Why unverified: L4's consequent includes graphState="collecting" as a
 *         valid resolution. In the multi-agent case, GraphAfterForceDedup can
 *         transition graphState to "collecting" to begin a new epoch rather than
 *         proceeding directly to "done" or "warn". TLC only exercises the terminal
 *         resolution (→"done"/"warn") because MaxAgents=1 never enables the
 *         →"collecting" return branch of GraphAfterForceDedup.
 *     (2) Boundary: MaxAgents=1 means agentsCompleted + 1 >= MaxAgents is always
 *         true at GraphWriteSuccess/GraphWriteFail, so graphState never returns
 *         to "collecting" after a dedup resolution. The multi-agent →"collecting"
 *         arm of L4's consequent is satisfied vacuously by TLC.
 *     (3) Compensating test: Integration tests seed a multi-agent pipeline with a
 *         duplicate node submission to confirm the dedup cycle resolves and the
 *         pipeline continues to subsequent agent epochs rather than terminating.
 *
 *   L5 (GraphEventuallyFinishes):
 *     (1) Why unverified: L5's antecedent requires graphState="collecting" in a
 *         running pipeline. Under MaxAgents=1, collecting state is visited exactly
 *         once per pipeline run (GraphStartCollecting fires once; GraphWriteMarkdown
 *         then transitions to "writing" and the epoch closes). Multi-agent runs
 *         re-enter "collecting" after each intermediate write (MaxAgents > 1), and
 *         L5 must hold for each re-entry. TLC only verifies the first-entry case.
 *     (2) Boundary: MaxAgents=1 means graphState="collecting" is entered at most
 *         once per pipeline run. For MaxAgents >= 2, the return path from
 *         GraphWriteSuccess keeps pipelineState="running" and re-enters collecting,
 *         creating multiple L5 obligations that TLC never exercises.
 *     (3) Compensating test: Integration tests run a MaxAgents=3 pipeline through
 *         multiple collection epochs and verify each epoch terminates (reaches
 *         "writing" then "done" or returns to "collecting") within a bounded step
 *         count, confirming L5 holds across all epochs.
 *
 * RESOLUTION: The structural properties (S30/S31: no action removes from
 * graphNodes or graphEdges; S25: increment-before-terminal) provide strong
 * confidence in the multi-agent case beyond TLC verification. The liveness
 * properties (L4/L5) are covered structurally by WF_vars fairness on all
 * graph actions, which applies regardless of MaxAgents. All multi-agent paths
 * are covered by integration tests as enumerated above. Increasing MaxAgents
 * is recorded as a future verification extension.
 *
 * SECOND CONFIGURATION — TokenSaving-MultiAgent.cfg (Revision 20 — O-8 fix):
 * A second TLC configuration has been created at TokenSaving-MultiAgent.cfg with:
 *
 *   MaxAgents   = 2   (exercises cross-epoch "collecting" return branch)
 *   MaxGraphOps = 3   (same as primary .cfg; sufficient for dedup coverage)
 *   MaxRetries  = 1   (reduced from 3 to keep state space tractable at MaxAgents=2)
 *
 * This configuration partially addresses the five unverified properties above.
 * With MaxAgents=2, TLC exercises:
 *   - The GraphWriteSuccess→"collecting" return branch (S25/S30/S31 multi-epoch)
 *   - L4/L5 with a second epoch re-entry from the "collecting" return branch
 * MaxRetries=1 limits the retry ladder to one cycle per dedup event, reducing
 * the state space expansion from two-epoch accumulation in graphNodes/graphEdges.
 *
 * Properties verified in TokenSaving-MultiAgent.cfg that are unverified in the
 * primary .cfg: S25 (multi-epoch completion guard), S30/S31 (cross-epoch monotone
 * accumulation), and the multi-epoch paths of L4/L5. Note that MaxRetries=1 means
 * the full 3-retry ladder (verified in the primary .cfg) is NOT re-verified in
 * the multi-agent configuration; these are complementary scopes, not redundant.
 *
 * ROUTING-ONLY PROPERTIES — UNAFFECTED BY MaxAgents (Revision 20 — O-4 fix):
 * The following liveness properties are ROUTING-STATE properties whose reachable
 * state space is independent of MaxAgents. They are fully TLC-verified under both
 * MaxAgents=1 (primary .cfg) and MaxAgents=2 (TokenSaving-MultiAgent.cfg):
 *
 *   L9  (ResolvingLeadsToInvokingOrError): depends only on routingState and
 *       mappingEntryExists. No graph variable appears in its guard or consequent.
 *   L11 (ValidatingLeadsToResolvingOrError): depends only on routingState and
 *       inputRole. No graph variable appears in its guard or consequent.
 *
 * These two properties are not part of D31's scope limitation and should NOT be
 * listed as "unverified for multi-agent configurations". Their TLC verification
 * status is complete under all MaxAgents values. See L9 and L11 comment blocks
 * for the explicit "TLC-verified; unaffected by D31 scope" annotation.
 *)
MaxAgentsOneModelCheckingScopeIsDeclaredAbstraction == TRUE
ASSUME MaxAgentsOneModelCheckingScopeIsDeclaredAbstraction

(*
 * Design ASSUME D32: GraphRetryEdgeSuccess single-node forced-exhaustion path
 * is a declared abstraction.
 *
 * When |graphNodes| = 1 (exactly one accepted node, say n) and the current
 * pendingEdge is <<n, n>> (the unique self-loop), GraphRetryEdgeSuccess's
 * combined guard requires:
 *   \E from \in graphNodes, to \in graphNodes :
 *       <<from,to>> \notin graphEdges /\ <<from,to>> /= pendingEdge
 *
 * With graphNodes = {n}, the only candidate pair is <<n,n>>. If <<n,n>> equals
 * pendingEdge, the /= pendingEdge conjunct eliminates the sole candidate —
 * GraphRetryEdgeSuccess is permanently disabled in this configuration. The
 * retry budget exhausts exclusively through GraphRetryEdgeStillDuplicate
 * (which re-enters dedup_error with retryCount UNCHANGED per ASSUME D19),
 * eventually reaching retryCount >= MaxRetries and triggering GraphForceDedup.
 *
 * This path is structurally valid and covered by L4 (DuplicateEventuallyResolves)
 * via GraphForceDedup → GraphAfterForceDedup → "collecting". No BDD scenario
 * explicitly covers this corner case. The R14 defensive guard (<<from,to>> /= pendingEdge)
 * was added for symmetry with the R12 node fix; its operational consequence —
 * forced exhaustion when |graphNodes| = 1 — was undeclared.
 *
 * RESOLUTION: With NodePaths = {p1, p2} and MaxGraphOps = 3, TLC can reach
 * |graphNodes| = 1 states and exercises this forced-exhaustion path. The path is
 * correct by construction; this ASSUME documents the corner case for readers of
 * the R14 guard decision.
 *)
GraphRetryEdgeSingleNodeForcedExhaustionIsDeclaredAbstraction == TRUE
ASSUME GraphRetryEdgeSingleNodeForcedExhaustionIsDeclaredAbstraction

(*
 * Design ASSUME D33: Command token rewrite is modeled as a boolean flag only —
 * declared abstraction.
 *
 * HookRewrite models the rewrite by setting hookRewritten = TRUE. The actual
 * token replacement performed by the real hook script — replacing the original
 * command string with the tool-specific equivalent in the tool-call payload
 * (e.g., "find" → "es", "grep" → "rg") — is not represented in the model.
 * The model records only that a rewrite occurred, not:
 *   (a) Which original command string was replaced.
 *   (b) Which replacement string was produced.
 *   (c) Whether the replacement is semantically correct for the given command.
 *
 * hookKind ("es" or "rg") records which hook fired and therefore which
 * replacement direction applies, but hookCommand retains the original command
 * string throughout the rewriting phase. HookExecuteSuccess clears hookCommand
 * to NULL without modelling any "rewritten command string" variable.
 *
 * RESOLUTION: The boolean hookRewritten flag is sufficient to verify the state
 * machine properties verified here: S3 (NoHookFallback) requires rewrite before
 * error; S15 (HookCleanupComplete) verifies cleanup; S28 (HookErrorPreservesKind)
 * verifies diagnostic attribution. Semantic correctness of the token replacement
 * is enforced by the PowerShell hook script implementation and tested at the
 * integration level, not by this TLA+ model.
 *)
CommandTokenRewriteOnlyIsDeclaredAbstraction == TRUE
ASSUME CommandTokenRewriteOnlyIsDeclaredAbstraction

(*
 * Design ASSUME D34: MaxRetries=3 model-checking scope is a declared abstraction.
 *
 * The .cfg sets MaxRetries=3. This value was 1 in Revision 7 and was raised to 3
 * in Revision 9 (D4 fix) to make the complete BDD retry ladder reachable by TLC
 * and to verify the force-dedup boundary (retryCount reaching MaxRetries=3 triggers
 * GraphForceDedup). The ASSUME discipline established by D31 (MaxAgents=1) was not
 * applied to MaxRetries at that time; T-2 identifies this gap.
 *
 * Under MaxRetries=3, TLC exercises:
 *   - 1st retry:  dedup_error → GraphRetry (retryCount 0→1) → retrying
 *   - 2nd retry:  dedup_error → GraphRetry (retryCount 1→2) → retrying
 *   - 3rd retry:  dedup_error → GraphRetry (retryCount 2→3) → retrying
 *   - Force path: retryCount=3 >= MaxRetries → GraphForceDedup fires
 * The BDD canonical retry budget (MaxRetries=3) is thus fully exercised by TLC.
 *
 * The following properties traverse the force-dedup path. Both are verified by
 * TLC at MaxRetries=3 for single-agent runs (MaxAgents=1); the multi-agent
 * force-dedup interaction falls under D31's scope limitation:
 *
 *   L4 (DuplicateEventuallyResolves):
 *     (1) Why multi-agent force-dedup is scope-limited: TLC exercises the
 *         GraphForceDedup → GraphAfterForceDedup → "collecting" path within a
 *         single epoch. With MaxAgents=1, that path always terminates the epoch
 *         ("collecting" → "writing" → "done"/"warn"). The force-dedup resolution
 *         followed by a non-final epoch return to "collecting" (MaxAgents > 1)
 *         is not exercised by TLC.
 *     (2) Boundary: MaxRetries=3 is sufficient for TLC to verify the single-epoch
 *         force-dedup path. The multi-agent interaction falls under D31.
 *     (3) Compensating test: Integration tests submit MaxRetries+1 consecutive
 *         duplicate nodes to confirm GraphForceDedup fires and the epoch
 *         continues normally to the write phase.
 *
 *   L5 (GraphEventuallyFinishes):
 *     (1) Why multi-agent force-dedup is scope-limited: same as L4. TLC verifies
 *         the single-epoch collecting→force_dedup→collecting→writing path at
 *         MaxRetries=3. Multi-epoch force-dedup interactions are not exercised
 *         under MaxAgents=1 (D31 scope).
 *     (2) Boundary: identical to L4 — MaxRetries=3 matches BDD; the residual
 *         scope gap is the MaxAgents interaction, not the retry count.
 *     (3) Compensating test: same MaxRetries=3 integration test suite as L4;
 *         verifies graphState reaches "writing" after force-dedup resolves
 *         within each epoch, and that graphOpsCount is reset to 0.
 *
 * RESOLUTION: MaxRetries=3 matches the BDD canonical retry budget. TLC fully
 * verifies the force-dedup path for single-agent runs. The remaining scope gap —
 * multi-agent force-dedup interactions across epochs — is documented in D31 and
 * covered by D31's compensating integration tests. Increasing MaxRetries beyond 3
 * would not improve TLC coverage for the currently verified properties and would
 * expand the state space without benefit.
 *)
MaxRetriesThreeModelCheckingScopeIsDeclaredAbstraction == TRUE
ASSUME MaxRetriesThreeModelCheckingScopeIsDeclaredAbstraction

(*
 * Design ASSUME D35: MaxAgents >= 1 is a declared structural constraint.
 *
 * GraphWriteMarkdown guards on agentsCompleted < MaxAgents. If MaxAgents = 0,
 * this guard is permanently FALSE: agentsCompleted is initialised to 0, and
 * 0 < 0 is always FALSE. GraphWriteMarkdown is permanently disabled, making
 * graphState = "writing" unreachable. graphState can therefore never advance to
 * "done" or "warn", violating L5 (GraphEventuallyFinishes): a quiesced
 * graphState = "collecting" with pipelineState = "running" can never satisfy the
 * consequent {done, warn}.
 *
 * A symmetric structural issue exists at MaxRetries = 0: GraphRetry's guard
 * (retryCount < MaxRetries) would be permanently FALSE (0 < 0), leaving
 * graphState = "dedup_error" able to reach GraphForceDedup but unable to reach
 * "retrying". GraphForceDedup is then the only exit, trivially exhausting retries
 * in one step — a degenerate but not deadlocked path. MaxAgents = 0 is strictly
 * worse: it creates a true deadlock in the graph subsystem with no exit.
 *
 * The .cfg sets MaxAgents = 1 and TLC never models MaxAgents = 0. However, the
 * ASSUME discipline established by D31 (MaxAgents=1 scope) and D34 (MaxRetries=3
 * scope) was not applied to the minimum-value structural requirement. D35 fills
 * this gap, formally declaring MaxAgents >= 1 as a structural precondition of
 * the graph subsystem's liveness guarantees.
 *)
MaxAgentsAtLeastOneDeclaredConstraint == MaxAgents >= 1
ASSUME MaxAgentsAtLeastOneDeclaredConstraint

(*
 * Design ASSUME D36: pipelineState='idle' Init artifact is a declared abstraction.
 *
 * Init sets pipelineState = "idle". No BDD scenario seeds or asserts pipelineState =
 * "idle"; all BDD Given-clauses that reference pipelineState correspond to
 * pipelineState = "running" or a later state. The Init "idle" value is a pre-start
 * TLA+ modeling artifact representing the system before StartPipeline fires.
 *
 * StartPipeline atomically transitions pipelineState from "idle" to "running" and
 * assigns inputRole and inputModel nondeterministically. In the real pipeline, there
 * is no observable "idle" state between program startup and the first invocation: the
 * pipeline starts running immediately on invocation. The Init "idle" value is a
 * modeling boundary artifact, not a BDD-specified observable state.
 *
 * RESOLUTION: This Init artifact is asymmetric with D24 (which formally declares the
 * analogous inputRole = NULL Init artifact). Both Init artifacts are symmetric in
 * structure and rationale: both represent "not yet started" values that are overwritten
 * atomically by StartPipeline and have no BDD counterpart. D24 was documented in
 * Revision 13; the corresponding pipelineState = "idle" declaration was omitted. D36
 * fills this documentation gap in the ASSUME discipline.
 *
 * NOTE: pipelineState = "idle" in Init is semantically distinct from a hypothetical
 * "system quiesced" or "awaiting trigger" idle state that a BDD might specify. No such
 * state appears in the BDD scenarios for this feature. The Init value should not be
 * read as a claim that the real system has an observable idle phase.
 *)
PipelineIdleInitArtifactIsDeclaredAbstraction == TRUE
ASSUME PipelineIdleInitArtifactIsDeclaredAbstraction

(*
 * Design ASSUME D37: hookKind has no BDD glossary entry — declared abstraction.
 *
 * hookKind is a named TLA+ state variable with domain {"none", "es", "rg"}.
 * It appears in:
 *   - D15 (Revision 10): added to preserve which hook fired at the error terminal
 *     for post-failure attribution diagnostics; HookExecuteFail was changed to
 *     leave hookKind unchanged (previously cleared it to "none").
 *   - S28 (HookErrorPreservesKind): hookState = "error" => hookKind ∈ {"es","rg"}.
 *
 * The BDD glossary defines hookState, hookCommand, and hookRewritten with their
 * domains. It does not have a dedicated entry for hookKind. The BDD does distinguish
 * es and rg failure modes via separate scenarios ("es-hook rewrite fails at runtime",
 * "rg-hook rewrite fails at runtime"), but the state variable that preserves this
 * distinction across the "error" terminal transition was introduced by the TLA+ model
 * (D15) without a corresponding BDD glossary registration.
 *
 * RESOLUTION: hookKind is a sound modeling addition. The failure-attribution behavior
 * it encodes is implicit in the BDD's separate es/rg failure scenarios: distinguishing
 * which hook failed is meaningful for diagnostics ("which hook subsystem caused a
 * failure"). D37 formally registers this gap in the ASSUME discipline (D2–D36),
 * completing the documentation of state variables whose domains extend beyond explicit
 * BDD glossary entries.
 *)
HookKindBDDGlossaryGapIsDeclaredAbstraction == TRUE
ASSUME HookKindBDDGlossaryGapIsDeclaredAbstraction

(*
 * Design ASSUME D38: FindCmds and GrepCmds are intentional single-element
 * command-enumeration collapses — declared abstraction. (Revision 20 — O-5 fix)
 *
 * FindCmds = {"find"} and GrepCmds = {"grep"} are single-element representative
 * sets. The full BDD command enumerations are:
 *
 *   FindCmds (BDD): {find, ls, dir, Get-ChildItem, gci}
 *     — all commands that enumerate filesystem entries and should be rewritten to "es"
 *   GrepCmds (BDD): {grep, egrep, fgrep, Select-String, sls}
 *     — all commands that search file content and should be rewritten to "rg"
 *
 * TLA+ collapses each enumeration to a single representative string. This is
 * analogous to D9 (PlainCmds = {"get_content"} collapses "Get-Content" normalization)
 * and D16 (DocWriter/CodeWriter collapse hyphenated BDD strings). Neither D9 nor D16
 * was cited when FindCmds and GrepCmds were defined; D38 closes the documentation
 * gap in the D2–D37 ASSUME discipline.
 *
 * RESOLUTION: The collapse is sound for all verified safety and liveness properties.
 * Safety invariants S13 (EsHookOnlyForFind: hookKind="es" => hookCommand ∈ FindCmds)
 * and S14 (RgHookOnlyForGrep: hookKind="rg" => hookCommand ∈ GrepCmds) verify the
 * classification boundary using the representative set. Expanding FindCmds and
 * GrepCmds to include all BDD-enumerated strings would increase the cardinality of
 * hookCommand's value domain but would not change the truth value of any verified
 * property: each additional command string is classified identically to its
 * representative under HookInterceptEs/HookInterceptRg's guards.
 *
 * State-space impact: with NodePaths={p1,p2} and MaxGraphOps=3, the current
 * configuration keeps the state space tractable. Adding five strings to FindCmds
 * and five to GrepCmds would multiply the hookCommand branching factor by 6x
 * in HookInterceptEs/HookInterceptRg, expanding the state space without yielding
 * additional verified coverage.
 *
 * The full pattern-match logic — matching "Get-ChildItem" as well as "gci",
 * "egrep" as well as "grep" — is enforced by the PowerShell hook script
 * implementation and tested at the integration level, not by this TLA+ model.
 *)
FindCmdsGrepCmdsEnumerationCollapseIsDeclaredAbstraction == TRUE
ASSUME FindCmdsGrepCmdsEnumerationCollapseIsDeclaredAbstraction

-----------------------------------------------------------------------------

VARIABLES
    \* --- Pipeline ---
    pipelineState,      \* "idle" | "running" | "halted" | "done"

    \* --- Model Routing ---
    routingState,       \* "idle" | "validating" | "resolving" | "invoking" | "done" | "error"
    resolvedModel,      \* The model selected for invocation, or NULL
    inputRole,          \* Role chosen nondeterministically at pipeline start
    inputModel,         \* Optional model override (NULL = use mapping)
    mappingEntryExists, \* TRUE iff config file has an entry for inputRole

    \* --- Hook ---
    hookState,          \* "idle" | "intercepting" | "rewriting" | "done" | "error"
    hookCommand,        \* The command currently being processed, or NULL
    hookKind,           \* Which hook fired: "none" | "es" | "rg"
    hookRewritten,      \* TRUE if the command has been rewritten

    \* --- Knowledge Graph ---
    graphState,         \* "idle" | "collecting" | "building" | "dedup_error" |
                        \*   "retrying" | "force_dedup" | "writing" | "done" | "warn"
    graphNodes,         \* Set of node paths accepted into the graph
    graphEdges,         \* Set of <<from, to>> edge tuples accepted into the graph
    pendingKind,        \* "none" | "node" | "edge"
    pendingNode,        \* Node path currently being built/checked, or NULL
    pendingEdge,        \* Edge <<from,to>> currently being built/checked, or NULL
    retryCount,         \* Dedup retry counter; scoped to current dedup cycle;
                        \*   reset to 0 at every dedup-cycle resolution and epoch boundary
    markdownState,      \* "none" | "current" | "stale"
    agentsCompleted,    \* Close-hook write events completed so far (0..MaxAgents)
    graphOpsCount       \* Discovery ops used in current epoch (0..MaxGraphOps)

vars == <<pipelineState,
          routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
          hookState, hookCommand, hookKind, hookRewritten,
          graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
          retryCount, markdownState, agentsCompleted, graphOpsCount>>

-----------------------------------------------------------------------------
(* Type invariant *)

TypeOK ==
    /\ pipelineState      \in {"idle", "running", "halted", "done"}
    /\ routingState       \in {"idle", "validating", "resolving", "invoking", "done", "error"}
    /\ resolvedModel      \in Models \cup {NULL}
    /\ inputRole          \in AllRoles \cup {NULL}
    /\ inputModel         \in AllModels
    /\ mappingEntryExists \in BOOLEAN
    /\ hookState          \in {"idle", "intercepting", "rewriting", "done", "error"}
    /\ hookCommand        \in AllHookCmds \cup {NULL}
    /\ hookKind           \in {"none", "es", "rg"}
    /\ hookRewritten      \in BOOLEAN
    /\ graphState         \in {"idle", "collecting", "building", "dedup_error",
                               "retrying", "force_dedup", "writing", "done", "warn"}
    /\ graphNodes         \subseteq NodePaths
    /\ graphEdges         \subseteq (NodePaths \X NodePaths)
    /\ pendingKind        \in {"none", "node", "edge"}
    /\ pendingNode        \in NodePaths \cup {NULL}
    /\ pendingEdge        \in (NodePaths \X NodePaths) \cup {NULL}
    /\ retryCount         \in 0..MaxRetries
    /\ markdownState      \in {"none", "current", "stale"}
    /\ agentsCompleted    \in 0..MaxAgents
    /\ graphOpsCount      \in 0..MaxGraphOps

-----------------------------------------------------------------------------
(* Initial state *)

Init ==
    /\ pipelineState     = "idle"
    /\ routingState      = "idle"
    /\ resolvedModel     = NULL
    /\ inputRole         = NULL
    /\ inputModel        = NULL
    /\ mappingEntryExists = TRUE
    /\ hookState         = "idle"
    /\ hookCommand       = NULL
    /\ hookKind          = "none"
    /\ hookRewritten     = FALSE
    /\ graphState        = "idle"
    /\ graphNodes        = {}
    /\ graphEdges        = {}
    /\ pendingKind       = "none"
    /\ pendingNode       = NULL
    /\ pendingEdge       = NULL
    /\ retryCount        = 0
    /\ markdownState     = "none"
    /\ agentsCompleted   = 0
    /\ graphOpsCount     = 0

-----------------------------------------------------------------------------
(* ============================== *)
(* MODEL ROUTING ACTIONS          *)
(* ============================== *)

StartPipeline ==
    /\ pipelineState = "idle"
    /\ \E role \in AllRoles :
        inputRole' = role
    /\ \E model \in AllModels :
        inputModel' = model
    /\ \E b \in BOOLEAN :
        mappingEntryExists' = b
    /\ pipelineState' = "running"
    /\ routingState'  = "validating"
    /\ UNCHANGED <<resolvedModel,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

ValidateRoleSuccess ==
    /\ routingState = "validating"
    /\ inputRole \in Roles
    /\ routingState' = "resolving"
    /\ UNCHANGED <<pipelineState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

ValidateRoleFail ==
    /\ routingState = "validating"
    /\ inputRole \notin Roles
    /\ routingState'  = "error"
    /\ pipelineState' = "halted"
    /\ UNCHANGED <<resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

ResolveModel ==
    /\ routingState = "resolving"
    /\ inputRole \in Roles
    /\ mappingEntryExists = TRUE
    /\ IF inputModel /= NULL /\ inputModel \in Models
       THEN resolvedModel' = inputModel
       ELSE resolvedModel' = RoleMapping[inputRole]
    /\ routingState' = "invoking"
    /\ UNCHANGED <<pipelineState, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

MappingLookupFail ==
    /\ routingState = "resolving"
    /\ inputRole \in Roles
    /\ mappingEntryExists = FALSE
    /\ routingState'  = "error"
    /\ pipelineState' = "halted"
    /\ UNCHANGED <<resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

InvokeClaude ==
    /\ routingState  = "invoking"
    /\ resolvedModel /= NULL
    /\ routingState' = "done"
    /\ UNCHANGED <<pipelineState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

-----------------------------------------------------------------------------
(* ============================== *)
(* SEARCH HOOK ACTIONS            *)
(* ============================== *)

(*
 * D8 / D21 note (corrected in Revision 11; ASSUME D21 added in Revision 12):
 *
 * WF_vars(HookInterceptEs) and WF_vars(HookInterceptRg) are included in
 * Fairness. These conditions ensure that if these actions are continuously
 * enabled, TLC must eventually take them. However, no liveness property in
 * L1–L8 requires a hook intercept to fire in a valid witness trace.
 * PipelineComplete accepts hookState="idle" (ASSUME D22), so L1 witnesses
 * can complete without any hook firing. WF is trivially discharged for these
 * paths once pipelineState becomes terminal (the actions are no longer enabled).
 * See ASSUME D21 for the full rationale. Integration tests must cover hook
 * intercept scenarios end-to-end.
 *)
HookInterceptEs ==
    /\ hookState     = "idle"
    /\ pipelineState = "running"
    /\ \E cmd \in FindCmds :
        /\ hookCommand' = cmd
        /\ hookKind'    = "es"
        /\ hookState'   = "intercepting"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

HookInterceptRg ==
    /\ hookState     = "idle"
    /\ pipelineState = "running"
    /\ \E cmd \in GrepCmds :
        /\ hookCommand' = cmd
        /\ hookKind'    = "rg"
        /\ hookState'   = "intercepting"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

HookRewrite ==
    /\ hookState   = "intercepting"
    /\ hookCommand /= NULL
    /\ hookState'    = "rewriting"
    /\ hookRewritten' = TRUE
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookCommand, hookKind,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

HookExecuteSuccess ==
    /\ hookState    = "rewriting"
    /\ hookRewritten = TRUE
    /\ hookState'   = "done"
    /\ hookCommand' = NULL
    /\ hookKind'    = "none"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * D15 fix: hookKind is preserved (not cleared) in the error terminal state.
 *
 * Prior to Revision 10, HookExecuteFail set hookKind="none", destroying the
 * record of which hook (es or rg) caused the runtime failure. BDD distinguishes
 * the es and rg failure modes with separate scenarios; post-failure diagnostic
 * attribution was impossible from the prior terminal state. hookKind now retains
 * its value ("es" or "rg") when hookState transitions to "error", enabling
 * inspection of which hook fired. HookCleanupComplete (S15) is unaffected:
 * it asserts hookKind="none" only in hookState="done" (not "error").
 * S28 (HookErrorPreservesKind) formally verifies hookKind∈{"es","rg"} in error state.
 *)
HookExecuteFail ==
    /\ hookState    = "rewriting"
    /\ hookRewritten = TRUE
    /\ hookState'   = "error"
    /\ hookCommand' = NULL
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

-----------------------------------------------------------------------------
(* ============================== *)
(* KNOWLEDGE GRAPH ACTIONS        *)
(* ============================== *)

GraphStartCollecting ==
    /\ graphState    = "idle"
    /\ pipelineState = "running"
    /\ graphState'   = "collecting"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * Agent discovers a node — queue it for build/dedup check.
 * graphOpsCount < MaxGraphOps bounds ops per epoch.
 * Per ASSUME D17: retry cycles do not count against graphOpsCount.
 * Per ASSUME D20: when graphOpsCount = MaxGraphOps, this action is disabled
 * and the epoch completes via GraphWriteMarkdown.
 *)
GraphAddNode ==
    /\ graphState    = "collecting"
    /\ pendingKind   = "none"
    /\ pipelineState = "running"
    /\ graphOpsCount < MaxGraphOps
    /\ \E path \in NodePaths :
        /\ pendingNode' = path
        /\ pendingKind' = "node"
        /\ graphState'  = "building"
    /\ graphOpsCount' = graphOpsCount + 1
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingEdge,
                   retryCount, markdownState, agentsCompleted>>

(*
 * Agent discovers an edge — queue it for build/dedup check.
 *
 * O2 fix: from and to are drawn from graphNodes (not NodePaths). Agents may
 * only reference nodes that have already been accepted into the graph. This
 * prevents ghost-reference edges (edges whose endpoints are never in graphNodes).
 * GraphAddEdge is therefore disabled when graphNodes = {}, which is correct:
 * no edge can be added before its endpoint nodes exist.
 *
 * Per ASSUME D17: retry cycles do not count against graphOpsCount.
 * Per ASSUME D20: when graphOpsCount = MaxGraphOps, this action is disabled
 * and the epoch completes via GraphWriteMarkdown.
 *)
GraphAddEdge ==
    /\ graphState    = "collecting"
    /\ pendingKind   = "none"
    /\ pipelineState = "running"
    /\ graphOpsCount < MaxGraphOps
    /\ graphNodes    /= {}
    /\ \E from \in graphNodes :
        \E to \in graphNodes :
            /\ pendingEdge' = <<from, to>>
            /\ pendingKind' = "edge"
            /\ graphState'  = "building"
    /\ graphOpsCount' = graphOpsCount + 1
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingNode,
                   retryCount, markdownState, agentsCompleted>>

(*
 * Node is new — accept and return to collecting.
 * O1/O6 fix: retryCount reset to 0. This dedup cycle has resolved; the counter
 * must not carry over into the next add operation.
 *)
GraphNodeBuildSuccess ==
    /\ graphState  = "building"
    /\ pendingKind = "node"
    /\ pendingNode /= NULL
    /\ pendingNode \notin graphNodes
    /\ graphNodes'  = graphNodes \cup {pendingNode}
    /\ pendingNode' = NULL
    /\ pendingKind' = "none"
    /\ graphState'  = "collecting"
    /\ retryCount'  = 0
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphEdges, pendingEdge,
                   markdownState, agentsCompleted, graphOpsCount>>

(*
 * Edge is new — accept and return to collecting.
 * O1/O6 fix: retryCount reset to 0 (same rationale as GraphNodeBuildSuccess).
 *)
GraphEdgeBuildSuccess ==
    /\ graphState  = "building"
    /\ pendingKind = "edge"
    /\ pendingEdge /= NULL
    /\ pendingEdge \notin graphEdges
    /\ graphEdges'  = graphEdges \cup {pendingEdge}
    /\ pendingEdge' = NULL
    /\ pendingKind' = "none"
    /\ graphState'  = "collecting"
    /\ retryCount'  = 0
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, pendingNode,
                   markdownState, agentsCompleted, graphOpsCount>>

(*
 * R12 rename: GraphDuplicateDetected → GraphNodeDuplicateDetected.
 *
 * All paired node/edge actions use the Graph{Node,Edge}* convention:
 *   GraphNodeBuildSuccess / GraphEdgeBuildSuccess
 *   GraphNodeDuplicateDetected / GraphEdgeDuplicateDetected   (this action)
 *   GraphRetryNodeSuccess / GraphRetryEdgeSuccess
 *   GraphRetryNodeStillDuplicate / GraphRetryEdgeStillDuplicate
 * The prior asymmetric name GraphDuplicateDetected deviated from this pattern.
 *)
GraphNodeDuplicateDetected ==
    /\ graphState  = "building"
    /\ pendingKind = "node"
    /\ pendingNode /= NULL
    /\ pendingNode \in graphNodes
    /\ graphState' = "dedup_error"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

GraphEdgeDuplicateDetected ==
    /\ graphState  = "building"
    /\ pendingKind = "edge"
    /\ pendingEdge /= NULL
    /\ pendingEdge \in graphEdges
    /\ graphState' = "dedup_error"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

GraphRetry ==
    /\ graphState  = "dedup_error"
    /\ retryCount  < MaxRetries
    /\ retryCount' = retryCount + 1
    /\ graphState' = "retrying"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   markdownState, agentsCompleted, graphOpsCount>>

(*
 * R12 fix: path /= pendingNode guard added.
 *
 * Prior guard: path \notin graphNodes. Since pendingNode is not yet in graphNodes
 * (it is the pending item awaiting acceptance, not an accepted node), pendingNode
 * satisfied path \notin graphNodes and could be selected as its own substitute.
 * This produced a non-productive retry cycle: the action fired (graphState →
 * "building", pendingNode unchanged), then GraphNodeDuplicateDetected immediately
 * fired again (pendingNode still \in graphNodes), exhausting retryCount without
 * making progress toward accepting a genuinely new node.
 *
 * Fix: path /= pendingNode ensures the substitute is distinct from the current
 * pending item. Combined with path \notin graphNodes, this guarantees the
 * substituted path is neither the current duplicate candidate nor any previously
 * accepted node — the retry makes genuine progress.
 *
 * Per ASSUME D7 (RetryPathSubstitutionIsDeclaredAbstraction): path substitution
 * is the TLA+ model of BDD's call-removal-and-notify mechanism.
 *)
GraphRetryNodeSuccess ==
    /\ graphState  = "retrying"
    /\ pendingKind = "node"
    /\ \E path \in NodePaths :
        /\ path \notin graphNodes
        /\ path /= pendingNode
        /\ pendingNode' = path
        /\ graphState'  = "building"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * D1 fix: from and to now range over graphNodes (not NodePaths).
 *
 * The Revision 8 O2 fix was applied to GraphAddEdge but missed here.
 * GraphRetryEdgeSuccess selects a replacement edge; the replacement
 * endpoints must be accepted graph nodes — the same constraint that
 * GraphAddEdge enforces. Using NodePaths would allow a retry to
 * substitute ghost endpoints that are not in graphNodes, violating
 * NoGhostEdges on the retry path.
 *
 * R14 fix: <<from,to>> /= pendingEdge guard added.
 *
 * Symmetric with R12's GraphRetryNodeSuccess fix (path /= pendingNode).
 * When "retrying" is entered via GraphEdgeDuplicateDetected, pendingEdge is
 * always in graphEdges, so <<from,to>> \notin graphEdges analytically already
 * excludes pendingEdge. The explicit guard is nonetheless added for defensive
 * symmetry: a future change to the path by which "retrying" is entered could
 * make pendingEdge \notin graphEdges, enabling a non-productive retry cycle
 * where the action selects the same edge as its own substitute. The combined
 * guards guarantee the replacement is both a non-duplicate and a distinct item.
 *
 * Per ASSUME D7 (RetryPathSubstitutionIsDeclaredAbstraction): path substitution
 * is the TLA+ model of BDD's call-removal-and-notify mechanism.
 *)
GraphRetryEdgeSuccess ==
    /\ graphState  = "retrying"
    /\ pendingKind = "edge"
    /\ \E from \in graphNodes :
        \E to \in graphNodes :
            /\ <<from, to>> \notin graphEdges
            /\ <<from, to>> /= pendingEdge
            /\ pendingEdge' = <<from, to>>
            /\ graphState'  = "building"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * Substitute path is also a duplicate — re-enter dedup_error.
 *
 * Per ASSUME D19 (StillDuplicateRetryCountInheritanceIsDeclaredAbstraction):
 * retryCount is UNCHANGED here. The shared retry budget carries the prior
 * GraphRetry increment forward, moving closer to MaxRetries (and GraphForceDedup)
 * without resetting. This is more conservative than BDD's per-cycle semantics
 * but guarantees bounded termination. See ASSUME D19 for full rationale.
 *)
GraphRetryNodeStillDuplicate ==
    /\ graphState  = "retrying"
    /\ pendingKind = "node"
    /\ pendingNode \in graphNodes
    /\ graphState' = "dedup_error"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * Substitute edge is also a duplicate — re-enter dedup_error.
 *
 * Per ASSUME D19: retryCount is UNCHANGED (same rationale as
 * GraphRetryNodeStillDuplicate above).
 *)
GraphRetryEdgeStillDuplicate ==
    /\ graphState  = "retrying"
    /\ pendingKind = "edge"
    /\ pendingEdge \in graphEdges
    /\ graphState' = "dedup_error"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * All retries exhausted — force deduplicate.
 * retryCount is NOT reset here; it is reset by GraphAfterForceDedup when
 * the state returns to "collecting". retryCount >= MaxRetries is preserved
 * through "force_dedup" so that ForceOnlyAfterRetries (S5) can be verified.
 *)
GraphForceDedup ==
    /\ graphState  = "dedup_error"
    /\ retryCount  >= MaxRetries
    /\ graphState'  = "force_dedup"
    /\ pendingNode' = NULL
    /\ pendingEdge' = NULL
    /\ pendingKind' = "none"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * Return to collecting after force-dedup, reset retry counter.
 *)
GraphAfterForceDedup ==
    /\ graphState  = "force_dedup"
    /\ graphState' = "collecting"
    /\ retryCount' = 0
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   markdownState, agentsCompleted, graphOpsCount>>

(*
 * Agent close hook triggers CLAUDE.md write.
 * SF (not WF): competes with add-actions for "collecting".
 *
 * D14 fix: guarded on graphState="collecting" only (not "idle").
 * GraphStartCollecting (WF_vars) always fires before this action, ensuring
 * the graph discovery phase has been initiated. See ASSUME
 * GraphWriteMarkdownRequiresCollecting for the full rationale.
 *)
GraphWriteMarkdown ==
    /\ graphState  = "collecting"
    /\ pendingKind = "none"
    /\ pendingNode = NULL
    /\ pendingEdge = NULL
    /\ pipelineState  = "running"
    /\ agentsCompleted < MaxAgents
    /\ graphState' = "writing"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(*
 * Write succeeds — CLAUDE.md updated.
 * O1/O6 fix: retryCount reset to 0 at epoch boundary.
 * S32 (CloseHookPrecedesNextEpoch) formally verifies agentsCompleted is
 * incremented only from graphState="writing".
 *)
GraphWriteSuccess ==
    /\ graphState      = "writing"
    /\ pipelineState   = "running"
    /\ markdownState'   = "current"
    /\ agentsCompleted' = agentsCompleted + 1
    /\ graphOpsCount'   = 0
    /\ retryCount'      = 0
    /\ graphState' = IF agentsCompleted + 1 >= MaxAgents
                     THEN "done"
                     ELSE "collecting"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge>>

(*
 * Write fails — log warning, continue.
 *
 * R11 BUG FIX: markdownState formula corrected from
 *   `IF markdownState = "current" THEN "stale" ELSE "none"`
 * to
 *   `IF markdownState = "current" THEN "stale" ELSE markdownState`
 *
 * The prior formula incorrectly transitioned markdownState "stale"→"none"
 * on a second consecutive write failure, discarding the stale signal. The
 * correct semantics: a failed write degrades "current" to "stale" (CLAUDE.md
 * was last good but may now be out-of-date), or leaves any other state
 * unchanged ("none" stays "none"; "stale" stays "stale"). S34
 * (MarkdownStateMonotone) formally verifies that markdownState never regresses
 * from "stale" or "current" to "none".
 *
 * O1/O6 fix: retryCount reset to 0 at epoch boundary.
 *)
GraphWriteFail ==
    /\ graphState      = "writing"
    /\ pipelineState   = "running"
    /\ markdownState'   = IF markdownState = "current" THEN "stale" ELSE markdownState
    /\ agentsCompleted' = agentsCompleted + 1
    /\ graphOpsCount'   = 0
    /\ retryCount'      = 0
    /\ graphState' = IF agentsCompleted + 1 >= MaxAgents
                     THEN "warn"
                     ELSE "collecting"
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge>>

(*
 * Pipeline halted while graph subsystem still active — abort gracefully.
 * O1/O6 fix: retryCount reset to 0 on cleanup.
 * R14 fix: graphOpsCount reset to 0 for symmetry with GraphWriteSuccess and
 *   GraphWriteFail, which both reset graphOpsCount' = 0 at epoch boundary.
 *   Since no next epoch follows pipeline halt, leaving graphOpsCount non-zero
 *   in the "warn" terminal state is inconsistent and prevented S35
 *   (GraphTerminalOpsClean) from holding in the halted path.
 * markdownState is UNCHANGED: GraphHaltCleanup does not alter the markdown
 * state regardless of which of the 7 active graphState values it fires from.
 * S33 (GraphHaltCleanupPreservesMarkdown) formally verifies this for all 7
 * entry states — including "writing", which distinguishes abort-during-write
 * (markdownState unchanged) from GraphWriteFail (markdownState updated).
 *)
GraphHaltCleanup ==
    /\ pipelineState = "halted"
    /\ graphState \in {"idle", "collecting", "building", "dedup_error",
                       "retrying", "force_dedup", "writing"}
    /\ graphState'    = "warn"
    /\ pendingNode'   = NULL
    /\ pendingEdge'   = NULL
    /\ pendingKind'   = "none"
    /\ retryCount'    = 0
    /\ graphOpsCount' = 0
    /\ UNCHANGED <<pipelineState, routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphNodes, graphEdges, markdownState, agentsCompleted>>

-----------------------------------------------------------------------------
(* ============================== *)
(* PIPELINE COMPLETION            *)
(* ============================== *)

(*
 * Pipeline completes when routing is done and all agent close hooks have run.
 * hookState="error" is accepted: hook failures do not block pipeline completion.
 * hookState="idle" is also accepted: see ASSUME D22 for rationale — a run where
 * no agent issues a search command completes normally without any hook intercept.
 *)
PipelineComplete ==
    /\ pipelineState = "running"
    /\ routingState  = "done"
    /\ graphState    \in {"done", "warn"}
    /\ hookState     \in {"idle", "done", "error"}
    /\ pipelineState' = "done"
    /\ UNCHANGED <<routingState, resolvedModel, inputRole, inputModel, mappingEntryExists,
                   hookState, hookCommand, hookKind, hookRewritten,
                   graphState, graphNodes, graphEdges, pendingKind, pendingNode, pendingEdge,
                   retryCount, markdownState, agentsCompleted, graphOpsCount>>

(* Explicit stuttering in terminal states — prevents TLC spurious deadlock reports *)
Terminated ==
    /\ pipelineState \in {"done", "halted"}
    /\ UNCHANGED vars

-----------------------------------------------------------------------------
(* Next-state relation *)

Next ==
    \/ StartPipeline
    \/ ValidateRoleSuccess
    \/ ValidateRoleFail
    \/ ResolveModel
    \/ MappingLookupFail
    \/ InvokeClaude
    \/ HookInterceptEs
    \/ HookInterceptRg
    \/ HookRewrite
    \/ HookExecuteSuccess
    \/ HookExecuteFail
    \/ GraphStartCollecting
    \/ GraphAddNode
    \/ GraphAddEdge
    \/ GraphNodeBuildSuccess
    \/ GraphEdgeBuildSuccess
    \/ GraphNodeDuplicateDetected
    \/ GraphEdgeDuplicateDetected
    \/ GraphRetry
    \/ GraphRetryNodeSuccess
    \/ GraphRetryEdgeSuccess
    \/ GraphRetryNodeStillDuplicate
    \/ GraphRetryEdgeStillDuplicate
    \/ GraphForceDedup
    \/ GraphAfterForceDedup
    \/ GraphWriteMarkdown
    \/ GraphWriteSuccess
    \/ GraphWriteFail
    \/ GraphHaltCleanup
    \/ PipelineComplete
    \/ Terminated

(*
 * See ASSUME D21 (HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction)
 * and ASSUME D22 (PipelineCompleteAcceptsIdleHookIsDeclaredAbstraction) for the
 * documented limitations of WF_vars(HookInterceptEs) and WF_vars(HookInterceptRg).
 *)
Fairness ==
    /\ WF_vars(StartPipeline)
    /\ WF_vars(ValidateRoleSuccess)
    /\ WF_vars(ValidateRoleFail)
    /\ WF_vars(ResolveModel)
    /\ WF_vars(MappingLookupFail)
    /\ WF_vars(InvokeClaude)
    /\ WF_vars(HookInterceptEs)
    /\ WF_vars(HookInterceptRg)
    /\ WF_vars(HookRewrite)
    /\ WF_vars(HookExecuteSuccess)
    /\ WF_vars(HookExecuteFail)
    /\ WF_vars(GraphStartCollecting)
    /\ WF_vars(GraphAddNode)
    /\ WF_vars(GraphAddEdge)
    /\ WF_vars(GraphNodeBuildSuccess)
    /\ WF_vars(GraphEdgeBuildSuccess)
    /\ WF_vars(GraphNodeDuplicateDetected)
    /\ WF_vars(GraphEdgeDuplicateDetected)
    /\ WF_vars(GraphRetry)
    /\ WF_vars(GraphRetryNodeSuccess)
    /\ WF_vars(GraphRetryEdgeSuccess)
    /\ WF_vars(GraphRetryNodeStillDuplicate)
    /\ WF_vars(GraphRetryEdgeStillDuplicate)
    /\ WF_vars(GraphForceDedup)
    /\ WF_vars(GraphAfterForceDedup)
    /\ SF_vars(GraphWriteMarkdown)
    /\ WF_vars(GraphWriteSuccess)
    /\ WF_vars(GraphWriteFail)
    /\ WF_vars(GraphHaltCleanup)
    /\ WF_vars(PipelineComplete)

Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
(* ============================== *)
(* SAFETY PROPERTIES              *)
(* ============================== *)

(*
 * S1: Unknown role always halts — never reaches model invocation.
 *
 * Strengthened in Revision 15: third conjunct added to directly assert
 * pipelineState="halted" in the error terminal. The prior two conjuncts
 * (resolvedModel=NULL, routingState≠"done") characterise the non-invocation
 * guarantee but leave the halt guarantee as a cross-invariant inference from
 * S6 (HaltedMeansRoutingError). The new conjunct makes the halt an auditable
 * part of the unknown-role contract itself:
 *   once the routing machine reaches "error" due to an unknown role,
 *   pipelineState must be "halted".
 * ValidateRoleFail atomically sets both routingState="error" and
 * pipelineState="halted", so the conjunct is structurally sound.
 *)
UnknownRoleNeverInvokes ==
    (inputRole /= NULL /\ inputRole \notin Roles) =>
        /\ resolvedModel = NULL
        /\ routingState /= "done"
        /\ (routingState = "error" => pipelineState = "halted")

(*
 * S2: Valid role with missing config entry also halts.
 *
 * Strengthened in Revision 16 (T2 fix — S1/S2 symmetry):
 * MappingLookupFail atomically sets routingState'="error" and
 * pipelineState'="halted", identical in structure to ValidateRoleFail.
 * R15 added the direct halt assertion to S1 (UnknownRoleNeverInvokes) but
 * not to S2. The symmetric conjunct is added here: once routingState="error"
 * due to a missing mapping, pipelineState must be "halted". This is
 * derivable from S6 (HaltedMeansRoutingError) combined with
 * MappingLookupFail's simultaneous writes, but naming it in S2 makes the
 * halt guarantee an auditable part of the missing-mapping contract itself,
 * symmetric with S1, rather than a cross-invariant inference.
 *)
MissingMappingNeverInvokes ==
    (inputRole \in Roles /\ mappingEntryExists = FALSE) =>
        /\ resolvedModel = NULL
        /\ routingState \notin {"invoking", "done"}
        /\ (routingState = "error" => pipelineState = "halted")

(* S3: No fallback on hook failure — command was rewritten before error *)
NoHookFallback ==
    hookState = "error" => hookRewritten = TRUE

(* S4: Retry count never exceeds MaxRetries *)
RetryBounded ==
    retryCount <= MaxRetries

(* S5: Force-dedup only happens after all retries are exhausted *)
ForceOnlyAfterRetries ==
    graphState = "force_dedup" => retryCount >= MaxRetries

(*
 * S6: A halted pipeline implies routing errored.
 *
 * SCOPE ANNOTATION — MODEL-STRUCTURAL PROPERTY ONLY (Revision 20 — O-3 fix):
 * This invariant is a structural consequence of THIS MODEL, not a universal claim
 * about the real system. In TLA+, pipelineState="halted" is set exclusively by
 * ValidateRoleFail and MappingLookupFail — both routing actions that atomically
 * also set routingState="error". No other action can produce pipelineState="halted".
 *
 * In the REAL SYSTEM, external abort signals (Ctrl-C, orchestrator kill, timeout)
 * can set pipelineState="halted" from ANY state — including routingState="invoking"
 * or routingState="done" — which would VIOLATE this invariant. S6 therefore does
 * NOT mean "pipeline halt always implies routing error in the real system."
 *
 * See ASSUME D25 (ExternalPipelineAbortIsUnmodeledAbstraction) for the full
 * rationale and scope declaration. This annotation makes the model-only scope
 * auditable directly at the property definition without requiring D25 cross-referencing.
 *)
HaltedMeansRoutingError ==
    pipelineState = "halted" => routingState = "error"

(* S7: A resolved model is always a member of the valid Models set *)
ResolvedModelValid ==
    resolvedModel /= NULL => resolvedModel \in Models

(* S8: A done pipeline implies routing succeeded *)
DoneImpliesRoutingDone ==
    pipelineState = "done" => routingState = "done"

(* S9: InvokeClaude requires a resolved model *)
InvokeRequiresModel ==
    resolvedModel = NULL => routingState \notin {"invoking", "done"}

(* S10: Node duplicate detection is accurate *)
NodeDuplicateDetectionIsAccurate ==
    (graphState = "dedup_error" /\ pendingKind = "node") =>
        pendingNode \in graphNodes

(* S11: Edge duplicate detection is accurate *)
EdgeDuplicateDetectionIsAccurate ==
    (graphState = "dedup_error" /\ pendingKind = "edge") =>
        pendingEdge \in graphEdges

(* S12: Plain Get-Content reads are never intercepted *)
PlainReadNeverIntercepted ==
    hookState = "intercepting" => hookCommand \notin PlainCmds

(* S13: es hook fires only for FindCmds *)
EsHookOnlyForFind ==
    (hookState = "intercepting" /\ hookKind = "es") => hookCommand \in FindCmds

(* S14: rg hook fires only for GrepCmds *)
RgHookOnlyForGrep ==
    (hookState = "intercepting" /\ hookKind = "rg") => hookCommand \in GrepCmds

(* S15: Hook state is fully cleaned up when done *)
HookCleanupComplete ==
    hookState = "done" => (hookCommand = NULL /\ hookKind = "none")

(* S16: Terminal graph states imply no pending work remains *)
GraphTerminalClean ==
    graphState \in {"done", "warn"} =>
        (pendingNode = NULL /\ pendingEdge = NULL /\ pendingKind = "none")

(*
 * S17: Hook errors do not block pipeline completion (strengthened in Revision 11).
 *
 * Prior form (Revision 10): was nearly vacuous — the consequent included
 * pipelineState="running", which is true in every transient state before
 * PipelineComplete fires, making the invariant trivially satisfied throughout
 * most of the run. The claim "hookState='error' alone cannot halt the pipeline"
 * was not formally encoded.
 *
 * New form: directly encodes the design intent. A hook failure alone (without a
 * concurrent routing error) cannot cause pipelineState="halted". If both hook
 * error and pipeline halt are observed, routing must also be in error state.
 * This is non-vacuous: it is violated if any action sets pipelineState="halted"
 * without setting routingState="error" while hookState="error".
 *)
HookErrorAllowsCompletion ==
    (hookState = "error" /\ pipelineState = "halted") => routingState = "error"

(* S18: agentsCompleted is session-scoped and bounded *)
AgentsCompletedBounded ==
    agentsCompleted \in 0..MaxAgents

(* S19: graphOpsCount is bounded per epoch *)
GraphOpsCountBounded ==
    graphOpsCount \in 0..MaxGraphOps

(*
 * S20: retryCount is scoped to the current dedup cycle. (O1/O6 fix)
 *
 * In all states outside the dedup machine (dedup_error, retrying, force_dedup),
 * retryCount must be 0. This enforces the epoch-boundary and cycle-resolution
 * resets added to GraphNodeBuildSuccess, GraphEdgeBuildSuccess, GraphWriteSuccess,
 * GraphWriteFail, GraphAfterForceDedup, and GraphHaltCleanup.
 *
 * "building" is intentionally excluded: retryCount may be > 0 in "building"
 * when the state was entered via GraphRetryNodeSuccess/GraphRetryEdgeSuccess
 * (the retry incremented the counter before the replacement was accepted).
 * The reset fires in GraphNodeBuildSuccess/GraphEdgeBuildSuccess upon acceptance.
 *
 * "dedup_error" is intentionally excluded — retryCount > 0 is valid there.
 * GraphRetry increments retryCount before transitioning to "retrying". When the
 * substitute path is itself a duplicate, GraphRetryNodeStillDuplicate or
 * GraphRetryEdgeStillDuplicate re-enters dedup_error with retryCount UNCHANGED
 * (per ASSUME D19, StillDuplicateRetryCountInheritanceIsDeclaredAbstraction).
 * This means dedup_error can be re-entered with retryCount > 0, and S20 must not
 * assert retryCount = 0 there. A regression that reset retryCount to 0 on
 * StillDuplicate re-entry would pass S20 silently — S20 does not check dedup_error,
 * so retryCount = 0 in dedup_error is not a violation of S20. The dedup_error
 * exclusion is a deliberate design choice, not an oversight; it reflects the shared
 * retry budget model documented in D19.
 *)
RetryCountClean ==
    graphState \in {"idle", "collecting", "writing", "done", "warn"} =>
        retryCount = 0

(*
 * S21: No ghost-reference edges. (O2 fix)
 *
 * Every accepted edge's endpoints must be accepted graph nodes.
 * GraphAddEdge is guarded on graphNodes (not NodePaths), making this
 * invariant structurally enforced: agents can only reference existing nodes.
 *)
NoGhostEdges ==
    \A e \in graphEdges :
        e[1] \in graphNodes /\ e[2] \in graphNodes

(*
 * S22: pipelineState="halted" is absorbing. (O7 fix)
 *
 * Expressed as a temporal formula; verified as PROPERTY in the .cfg.
 * Formally documents the design intent. A future spec modification creating
 * a halted->running transition would be caught immediately by TLC.
 *)
HaltedIsAbsorbing ==
    [](pipelineState = "halted" => [](pipelineState = "halted"))

(*
 * S23: pipelineState="done" is absorbing. (O7 fix, symmetric to S22)
 *)
DoneIsAbsorbing ==
    [](pipelineState = "done" => [](pipelineState = "done"))

(*
 * S24: hookState terminal states are absorbing. (O3/D3 fix)
 *
 * No reset action from "done" or "error" back to "idle" exists. Formally
 * verifies the HookSingleUsePerPipelineRun ASSUME as a temporal property.
 * See ASSUME HookSingleUsePerPipelineRun for the declared abstraction
 * boundary relative to BDD multi-command scenarios.
 *)
HookTerminalIsAbsorbing ==
    [](hookState \in {"done", "error"} => [](hookState \in {"done", "error"}))

(*
 * S25: Pipeline completion requires all agents to have completed. (D5 fix)
 *
 * PipelineComplete fires only when graphState \in {"done","warn"}, and
 * GraphWriteSuccess/GraphWriteFail increment agentsCompleted before
 * transitioning graphState to "done"/"warn" (when agentsCompleted+1 >=
 * MaxAgents). This invariant formally verifies that closure.
 *)
PipelineCompletionRequiresAllAgents ==
    pipelineState = "done" => agentsCompleted = MaxAgents

(*
 * S26: hookState="error" /\ pipelineState="halted" is a jointly absorbing
 * combined state. (D6 fix)
 *
 * Both hookState="error" and pipelineState="halted" can become true
 * concurrently (e.g., HookExecuteFail fires during a run that also suffers
 * a routing failure). L7 (HookErrorEventuallyCompletsPipeline) is liveness
 * only — it does not constrain what holds once the combined state is reached.
 * This safety property fills that gap: once both conditions hold, neither
 * can change (derivable from HaltedIsAbsorbing S22 and HookTerminalIsAbsorbing
 * S24, but named explicitly for auditable coverage).
 *)
HookErrorHaltedIsJointlyAbsorbing ==
    [](hookState = "error" /\ pipelineState = "halted" =>
       [](hookState = "error" /\ pipelineState = "halted"))

(*
 * S27: Mutual consistency of pendingKind, pendingNode, and pendingEdge. (D13 fix)
 *
 * Extended in Revision 11 with a fourth conjunct (retrying-state coherence gap):
 *   graphState = "retrying" => pendingKind ∈ {"node","edge"}
 *
 * Without this conjunct, a refactoring entering "retrying" with pendingKind="none"
 * satisfies all three structural conjuncts vacuously, passes all S1–S26 invariants,
 * and leaves both GraphRetryNodeSuccess and GraphRetryEdgeSuccess permanently
 * disabled (their guards require pendingKind="node"/"edge" respectively). The
 * retrying state becomes a deadlock in the dedup machine, silently undetected.
 *
 * Extended in Revision 13 with a fifth conjunct (building-state coherence gap):
 *   graphState = "building" => pendingKind ∈ {"node","edge"}
 *
 * Without this conjunct, a refactoring entering "building" with pendingKind="none"
 * satisfies S27's third conjunct (pendingNode=NULL /\ pendingEdge=NULL) vacuously,
 * passes all S1–S34 invariants, and disables all four building-exit actions:
 *   GraphNodeBuildSuccess        (guard: pendingKind = "node")
 *   GraphEdgeBuildSuccess    (guard: pendingKind = "edge")
 *   GraphNodeDuplicateDetected (guard: pendingKind = "node")
 *   GraphEdgeDuplicateDetected (guard: pendingKind = "edge")
 * The system deadlocks silently in "building" state. This fifth conjunct is the
 * direct symmetric complement of the Revision 11 retrying-state conjunct. Both
 * "building" and "retrying" are intermediate states whose exit actions require
 * pendingKind to be set; both must be guarded identically.
 *)
PendingCoherence ==
    /\ pendingKind = "node" => (pendingNode /= NULL /\ pendingEdge = NULL)
    /\ pendingKind = "edge" => (pendingEdge /= NULL /\ pendingNode = NULL)
    /\ pendingKind = "none" => (pendingNode = NULL /\ pendingEdge = NULL)
    /\ graphState  = "retrying" => pendingKind \in {"node", "edge"}
    /\ graphState  = "building" => pendingKind \in {"node", "edge"}

(*
 * S28: hookKind is preserved in the error terminal state. (D15 companion invariant)
 *
 * D15 (Revision 10) ensured HookExecuteFail preserves hookKind for post-failure
 * attribution. However, TypeOK permits hookKind="none" in hookState="error",
 * meaning a regression clearing hookKind on failure would pass TLC without this
 * named invariant. S28 closes that gap: whenever the hook machine is in the
 * error terminal state, the firing hook's identity must be recorded ("es" or "rg").
 *)
HookErrorPreservesKind ==
    hookState = "error" => hookKind \in {"es", "rg"}

(*
 * S29: Inter-hook mutual exclusion — named audit property. (new in Revision 11)
 *
 * HookInterceptEs and HookInterceptRg both require hookState="idle", making
 * simultaneous activation of two different hook kinds structurally impossible
 * in the current spec. This guarantee is implicit in the action guards. S29
 * makes it an auditable named property: when the hook machine is in an active
 * state, hookKind must be a recognized single-kind value, not "none" (which
 * would indicate no hook fired despite being in an active intercept state).
 *
 * A future spec modification that changed the idle guard on HookInterceptEs or
 * HookInterceptRg, allowing a hook to fire from "intercepting" state, would
 * violate S29 if hookKind remained from the prior intercept ("none" cannot
 * occur in "intercepting"/"rewriting" without this invariant being checked).
 *)
InterHookMutualExclusion ==
    hookState \in {"intercepting", "rewriting"} => hookKind \in {"es", "rg"}

(*
 * S30: graphNodes is monotone — never shrinks. (new in Revision 11)
 *
 * Multi-agent graph accumulation relies on nodes persisting across epochs.
 * This is structurally enforced (only GraphNodeBuildSuccess adds to graphNodes;
 * no action removes from it), but was formally unverified. A refactoring that
 * cleared graphNodes at an epoch boundary (e.g., in GraphWriteSuccess or
 * GraphAfterForceDedup) would pass all S1–S29 invariants while breaking the
 * BDD integration guarantee that later agents build on earlier agents' work.
 *)
GraphNodesMonotone ==
    [][graphNodes \subseteq graphNodes']_vars

(*
 * S31: graphEdges is monotone — never shrinks. (new in Revision 11)
 *
 * Symmetric to S30. graphEdges is only ever extended by GraphEdgeBuildSuccess;
 * no action removes from it. The same refactoring risk applies: clearing edges
 * at an epoch boundary would silently violate BDD accumulation guarantees.
 *)
GraphEdgesMonotone ==
    [][graphEdges \subseteq graphEdges']_vars

(*
 * S32: Close hook write event precedes epoch advance. (new in Revision 11)
 *
 * BDD guarantees "next stage MUST NOT begin before close hook completes."
 * Structurally, agentsCompleted is incremented only by GraphWriteSuccess and
 * GraphWriteFail, both guarded on graphState="writing". This temporal property
 * makes that constraint an explicit, named, TLC-verified contract. A refactoring
 * moving the agentsCompleted' increment into GraphWriteMarkdown (graphState →
 * "writing") would satisfy S25 (PipelineCompletionRequiresAllAgents) while
 * violating S32, because agentsCompleted would increase when graphState="collecting".
 *)
CloseHookPrecedesNextEpoch ==
    [][agentsCompleted' > agentsCompleted => graphState = "writing"]_vars

(*
 * S37: agentsCompleted is unchanged in any step where graphState /= "writing".
 * (new in Revision 18 — T-3 fix; comment corrected in Revision 19 — O-2 fix)
 *
 * S32 (CloseHookPrecedesNextEpoch) expresses the post-condition direction:
 *   agentsCompleted' > agentsCompleted => graphState = "writing" (pre-state).
 * S37 expresses the logically equivalent contrapositive as a distinct, directly
 * named invariant:
 *   graphState /= "writing" (pre-state) => agentsCompleted' = agentsCompleted.
 *
 * Both S32 and S37 are formally equivalent under contraposition and hold or
 * fail together under TLC. The value of S37 is direct auditability: a reader
 * inspecting whether agentsCompleted can increment outside the "writing" state
 * evaluates S37 immediately without applying contrapositive reasoning through
 * S32's post-condition framing. S37 and S32 verify the same constraint from
 * opposite reasoning directions — each independently checkable by TLC.
 *
 * NOTE (Revision 19 correction): the prior Revision 18 comment described a
 * regression counterexample — "an action simultaneously setting graphState'=
 * 'writing' /\ incrementing agentsCompleted' from graphState='collecting'" —
 * that is not constructible from the current action set. GraphWriteMarkdown
 * transitions collecting→"writing" without touching agentsCompleted; GraphWrite
 * Success and GraphWriteFail increment agentsCompleted but fire from graphState=
 * "writing", not "collecting". No single action in Next performs both writes from
 * graphState = "collecting". That claim overstated S37's regression-detection value
 * and has been removed. S37's value rests on auditability from the contrapositive
 * reasoning direction, not on hypothetical regression detection.
 *
 * S32 and S37 are complementary named properties covering the same constraint
 * from opposite reasoning directions. Both are registered as PROPERTY in the
 * .cfg so TLC verifies each independently.
 *)
WritingStateGatesAgentsCompleted ==
    [][graphState /= "writing" => agentsCompleted' = agentsCompleted]_vars

(*
 * S38: graphState="writing" implies agentsCompleted < MaxAgents.
 * (new in Revision 19 — O-6 fix)
 *
 * GraphWriteMarkdown's guard includes the conjunct agentsCompleted < MaxAgents,
 * which structurally ensures that graphState = "writing" is only reachable when
 * agentsCompleted < MaxAgents. This guarantee is auditable only via cross-action
 * reasoning through GraphWriteMarkdown's guard: a reader must inspect the action
 * body to verify it. If the guard were refactored — for example, the agentsCompleted
 * < MaxAgents conjunct removed, weakened, or relocated — the structural guarantee
 * would disappear silently; no prior named invariant would catch the regression.
 *
 * S38 makes the constraint independently verifiable as a named state predicate.
 * TLC checks it in every reachable state without guard inspection. A refactoring
 * that allowed graphState = "writing" to be reached when agentsCompleted >= MaxAgents
 * would be caught immediately as a direct S38 violation.
 *
 * Note: ASSUME D35 (MaxAgentsAtLeastOneDeclaredConstraint) guarantees MaxAgents >= 1,
 * ensuring the agentsCompleted < MaxAgents guard in GraphWriteMarkdown is not
 * vacuously permanently-FALSE from Init (where agentsCompleted = 0).
 *)
WritingAgentsCompletedBound ==
    graphState = "writing" => agentsCompleted < MaxAgents

(*
 * S33: GraphHaltCleanup preserves markdownState across all 7 active entry states.
 * (generalized in Revision 12; prior form only covered graphState="idle")
 *
 * ASSUME D12 claims markdownState UNCHANGED for ALL 7 active GraphHaltCleanup
 * entry states (idle, collecting, building, dedup_error, retrying, force_dedup,
 * writing). Prior S33 only verified the "idle" entry case; the six additional
 * states — including the critical "writing" case — were unverified by any named
 * property.
 *
 * The "writing" case is the most operationally significant: if GraphHaltCleanup
 * fires while graphState="writing" (pipeline halted mid-write), markdownState
 * must remain unchanged — distinguishing abort-during-write (no markdown update)
 * from GraphWriteFail (markdown state updated to "stale" or left unchanged at
 * "none"/"stale"). This distinction is critical for the next agent's context.
 *
 * S33 now uses the complete set of 7 active entry states, making the full D12
 * claim auditable by TLC.
 *)
GraphHaltCleanupPreservesMarkdown ==
    [][pipelineState = "halted" /\
       graphState \in {"idle", "collecting", "building", "dedup_error",
                       "retrying", "force_dedup", "writing"} /\
       graphState' = "warn" =>
       markdownState' = markdownState]_vars

(*
 * S34: markdownState is monotone — never regresses from "stale" or "current"
 * to "none". (new in Revision 12)
 *
 * The R11 GraphWriteFail bug fix ensures the formula
 *   `IF markdownState = "current" THEN "stale" ELSE markdownState`
 * prevents "stale"→"none" regression. However, no named temporal property
 * formally verified this monotonicity guarantee. A future refactoring that
 * re-introduced the prior incorrect formula, or added a new action that set
 * markdownState="none" unconditionally, would pass all S1–S33 properties
 * without this invariant.
 *
 * S34 encodes the monotonicity directly as a box-action property:
 *   - Once "stale", markdownState stays "stale" forever.
 *   - Once "current", markdownState can only stay "current" or degrade to "stale"
 *     (never regress to "none").
 * Together these assert: markdownState never transitions to "none" from any
 * non-"none" state. This formally closes the coverage gap for the R11 bug fix.
 *)
MarkdownStateMonotone ==
    [][(markdownState \in {"stale", "current"}) => markdownState' /= "none"]_vars

(*
 * S35: Terminal graph states have a reset epoch counter. (new in Revision 14)
 *
 * GraphWriteSuccess and GraphWriteFail both set graphOpsCount'=0 before
 * transitioning graphState to "done"/"warn"/"collecting". GraphHaltCleanup
 * (fixed in Revision 14) also sets graphOpsCount'=0, making all three terminal
 * write paths symmetric. This invariant formally verifies that the epoch counter
 * is always reset when the graph subsystem reaches a terminal state, so any
 * subsequent epoch starts clean.
 *
 * A refactoring that removed graphOpsCount'=0 from GraphWriteSuccess,
 * GraphWriteFail, or GraphHaltCleanup would be caught by S35 and by TLC
 * failing to verify this invariant.
 *
 * Note: "collecting" is excluded — graphOpsCount accumulates during the epoch
 * and may be non-zero while collecting is active.
 *)
GraphTerminalOpsClean ==
    graphState \in {"done", "warn"} => graphOpsCount = 0

(*
 * S36: Hook error state always has hookCommand cleared. (new in Revision 15)
 *
 * HookExecuteFail structurally sets hookCommand' = NULL before transitioning
 * hookState to "error". However, no named invariant verified this; S15
 * (HookCleanupComplete) asserts hookCommand = NULL only for hookState = "done".
 *
 * A future regression — e.g., preserving hookCommand in the error terminal for
 * diagnostic logging, or accidentally omitting hookCommand'=NULL from HookExecuteFail —
 * would pass S15 and all other safety properties without this invariant.
 *
 * S36 closes that gap, making the error-terminal command-clearing behaviour an
 * explicitly named, TLC-verified contract symmetric to S15's done-terminal claim.
 *)
HookErrorClearsCommand ==
    hookState = "error" => hookCommand = NULL

-----------------------------------------------------------------------------
(* ============================== *)
(* LIVENESS PROPERTIES            *)
(* ============================== *)

(* L1: Pipeline eventually reaches a terminal state *)
PipelineTerminates ==
    <>(pipelineState \in {"done", "halted"})

(* L2: Valid role with complete mapping eventually resolves a model *)
ValidRoleLeadsToModel ==
    (inputRole \in Roles /\ mappingEntryExists = TRUE) ~> (resolvedModel /= NULL)

(* L3: Unknown/invalid role eventually halts *)
InvalidRoleLeadsToHalt ==
    (inputRole \notin Roles /\ inputRole /= NULL) ~> (pipelineState = "halted")

(* L3b: Missing config entry also eventually halts *)
MissingMappingLeadsToHalt ==
    (inputRole \in Roles /\ mappingEntryExists = FALSE) ~> (pipelineState = "halted")

(*
 * L4: Duplicate error eventually resolves. (O4 fix — force_dedup removed)
 *
 * "force_dedup" is removed from the consequent. It is an intermediate
 * transient state; entering it trivially satisfied the prior weaker
 * formulation before GraphAfterForceDedup fired. This stronger version
 * requires the dedup cycle to fully resolve past force_dedup to "collecting"
 * (normal or force paths) or to a terminal graph state ("done", "warn").
 * GraphAfterForceDedup has WF fairness, so TLC can verify this.
 *
 * FORCE_DEDUP TRANSIENT WAYPOINT (Revision 20 — O-2 fix):
 * force_dedup is an explicitly covered transient waypoint on the dedup_error →
 * collecting chain. The full paths from dedup_error to the consequent are:
 *
 *   Normal resolution (retryCount < MaxRetries, substitute succeeds):
 *     dedup_error → (GraphRetry) → retrying →
 *       (GraphRetryNodeSuccess or GraphRetryEdgeSuccess) → building →
 *       (GraphNodeBuildSuccess or GraphEdgeBuildSuccess) → collecting
 *
 *   Force-dedup path (retryCount >= MaxRetries — TRANSIENT WAYPOINT):
 *     dedup_error → (GraphForceDedup, WF-fair) → force_dedup →
 *       (GraphAfterForceDedup, WF-fair) → collecting
 *
 *   Halt-cleanup path (pipelineState="halted" concurrently):
 *     dedup_error → (GraphHaltCleanup, WF-fair) → warn
 *
 * WF_vars fairness on GraphForceDedup and GraphAfterForceDedup guarantees the
 * system transits through force_dedup without stuttering: once force_dedup is
 * reached, GraphAfterForceDedup is enabled and WF ensures it fires. If either
 * WF(GraphForceDedup) or WF(GraphAfterForceDedup) were weakened, the system
 * could stutter indefinitely at dedup_error or force_dedup respectively, without
 * L4's consequent ({"collecting","done","warn"}) being reached — and L4 would
 * be falsified by TLC. This comment makes that fairness dependency explicit.
 *)
DuplicateEventuallyResolves ==
    (graphState = "dedup_error") ~>
        (graphState \in {"collecting", "done", "warn"})

(*
 * L4b: Duplicate error in a running pipeline eventually reaches a terminal
 * graph state.
 *
 * NOTE: This property covers the RUNNING-PIPELINE path only. The antecedent
 * requires pipelineState="running", so the halted-during-dedup_error path is
 * NOT covered here — that path is handled by L4 (DuplicateEventuallyResolves),
 * which accepts GraphHaltCleanup's dedup_error → warn transition as a valid
 * resolution and whose consequent includes "warn". L4b is strictly stronger
 * than L4 for running-pipeline traces only; they are complementary.
 *)
DuplicateEventuallyResolvedFully ==
    (graphState = "dedup_error" /\ pipelineState = "running") ~>
        (graphState \in {"done", "warn"})

(*
 * L5: Quiesced collecting state eventually finishes.
 * Verifiable because NodePaths is bounded AND graphOpsCount is bounded.
 *)
GraphEventuallyFinishes ==
    (graphState = "collecting" /\ pendingKind = "none" /\
     pendingNode = NULL /\ pendingEdge = NULL /\ pipelineState = "running") ~>
        (graphState \in {"done", "warn"})

(*
 * L6: An intercepting or rewriting hook eventually settles. (O9 fix)
 *
 * Extended from "intercepting" only to include "rewriting". A hook stuck in
 * "rewriting" satisfied no named liveness property in prior revisions.
 * WF_vars(HookExecuteSuccess) and WF_vars(HookExecuteFail) in Fairness
 * guarantee progress from "rewriting" to {"done","error"}.
 *)
HookEventuallySettles ==
    (hookState \in {"intercepting", "rewriting"}) ~> (hookState \in {"done", "error"})

(*
 * L7: A hook failure eventually allows pipeline completion. (O8 fix)
 *
 * Formally connects hookState="error" to pipelineState reaching a terminal
 * state. PipelineComplete accepts hookState="error" in its guard, so once
 * routing and graph subsystems reach their terminal states the pipeline
 * completes. This property makes the liveness chain explicit rather than
 * relying on undocumented WF assumptions.
 *)
HookErrorEventuallyCompletsPipeline ==
    (hookState = "error") ~> (pipelineState \in {"done", "halted"})

(*
 * L8: Invoking state eventually reaches routing done. (new in Revision 11)
 *
 * L2 (ValidRoleLeadsToModel) establishes resolvedModel≠NULL (set by
 * ResolveModel at routingState="resolving"→"invoking"). It does not cover
 * the final invoking→done transition performed by InvokeClaude. No liveness
 * property in L1–L7 formally connected routingState="invoking" to
 * routingState="done". L8 closes this gap. InvokeClaude has WF_vars fairness
 * and fires whenever routingState="invoking" /\ resolvedModel≠NULL (guaranteed
 * by S9). There is no error path from "invoking", so the consequent is "done".
 *)
InvokingLeadsToDone ==
    (routingState = "invoking") ~> (routingState = "done")

(*
 * L9: Resolving state eventually advances to invoking or error. (new in Revision 14)
 *
 * Analogous gap to L8 (InvokingLeadsToDone): L8 closed the invoking→done chain;
 * L9 closes the preceding resolving→{invoking,error} chain. From
 * routingState="resolving", exactly two actions are enabled:
 *   - ResolveModel fires if mappingEntryExists=TRUE  → routingState="invoking"
 *   - MappingLookupFail fires if mappingEntryExists=FALSE → routingState="error"
 * Both have WF_vars fairness. A deadlock in "resolving" state — e.g., if both
 * action guards were accidentally left false by a refactoring — violated no
 * named liveness property in L1–L8. L9 closes this gap.
 *
 * TLC-VERIFICATION STATUS (Revision 20 — O-4 fix):
 * L9 is a ROUTING-STATE property. Its guard (routingState="resolving") and
 * consequent (routingState ∈ {"invoking","error"}) reference only routingState
 * and mappingEntryExists — variables whose reachable value space is independent
 * of MaxAgents. L9 is FULLY TLC-VERIFIED under MaxAgents=1 and is UNAFFECTED
 * by the D31 scope limitation (MaxAgents=1 model-checking scope). L9 should NOT
 * be listed in D31's "unverified for multi-agent configurations" register.
 * The BDD frames this as an integration-test obligation; TLC supplements that
 * obligation with formal verification — both apply.
 *)
ResolvingLeadsToInvokingOrError ==
    (routingState = "resolving") ~> (routingState \in {"invoking", "error"})

(*
 * L10: Writing state eventually advances to the next graph state. (new in Revision 14)
 *
 * WF_vars(GraphWriteSuccess) and WF_vars(GraphWriteFail) provide progress from
 * graphState="writing", but no named liveness property captured this transition.
 * A deadlock in "writing" state — e.g., if both GraphWriteSuccess and
 * GraphWriteFail guards were accidentally made false — violated no liveness
 * property in L1–L9. L10 closes this gap. From graphState="writing", exactly
 * two actions are enabled:
 *   - GraphWriteSuccess → "done" (if agentsCompleted+1 >= MaxAgents)
 *                       → "collecting" (otherwise)
 *   - GraphWriteFail    → "warn" (if agentsCompleted+1 >= MaxAgents)
 *                       → "collecting" (otherwise)
 * Both have WF_vars fairness. The consequent covers all three reachable successors.
 *)
WritingLeadsToNextState ==
    (graphState = "writing") ~>
        (graphState \in {"done", "warn", "collecting"})

(*
 * L11: Validating state eventually advances to resolving or error. (new in Revision 15)
 *
 * Analogous gap to L9 (ResolvingLeadsToInvokingOrError): a deadlock in
 * routingState="validating" violated no named liveness property in L1–L10.
 * From routingState="validating", exactly two actions are enabled:
 *   - ValidateRoleSuccess fires if inputRole \in Roles    → routingState="resolving"
 *   - ValidateRoleFail    fires if inputRole \notin Roles → routingState="error"
 * Both have WF_vars fairness in Fairness. L11 closes this gap and completes
 * the full routing state machine liveness chain:
 *
 *   validating ~> {resolving, error}  (L11)
 *   resolving  ~> {invoking, error}   (L9,  Revision 14)
 *   invoking   ~> done               (L8,  Revision 11)
 *
 * TLC-VERIFICATION STATUS (Revision 20 — O-4 fix):
 * L11 is a ROUTING-STATE property. Its guard (routingState="validating") and
 * consequent (routingState ∈ {"resolving","error"}) reference only routingState
 * and inputRole — variables whose reachable value space is independent of MaxAgents.
 * L11 is FULLY TLC-VERIFIED under MaxAgents=1 and is UNAFFECTED by the D31 scope
 * limitation. L11 should NOT be listed in D31's "unverified for multi-agent
 * configurations" register. The BDD frames this as an integration-test obligation;
 * TLC supplements that obligation with formal verification — both apply.
 *)
ValidatingLeadsToResolvingOrError ==
    (routingState = "validating") ~>
        (routingState \in {"resolving", "error"})

(*
 * L12: Building state eventually advances to collecting, dedup_error, or warn.
 * (new in Revision 16 — T1 fix; renamed in Revision 18 — T-1 fix)
 *
 * By the naming pattern established by L8–L11 (one named liveness property
 * per non-terminal state), graphState="building" was the only non-terminal
 * graph state without a dedicated liveness property. S27's fifth conjunct
 * (Revision 13) establishes graphState="building" => pendingKind ∈ {"node","edge"},
 * which structurally prevents the pendingKind="none" deadlock that would disable
 * all four building-exit actions. L12 names the progress guarantee explicitly.
 *
 * From graphState="building", exactly four WF-fair exit actions are enabled:
 *   - GraphNodeBuildSuccess      (pendingKind="node") → graphState="collecting"
 *   - GraphEdgeBuildSuccess      (pendingKind="edge") → graphState="collecting"
 *   - GraphNodeDuplicateDetected (pendingKind="node") → graphState="dedup_error"
 *   - GraphEdgeDuplicateDetected (pendingKind="edge") → graphState="dedup_error"
 * Additionally, GraphHaltCleanup (WF-fair) fires whenever pipelineState="halted"
 * and graphState="building", transitioning directly to graphState="warn".
 * All five actions carry WF_vars fairness in Fairness. S27's fifth conjunct
 * guarantees at least one of the two pendingKind-appropriate build/dedup pairs
 * is always enabled when the pipeline is running.
 * L12 closes the building-state gap in the graph liveness chain:
 *
 *   building    ~> {collecting, dedup_error, warn}  (L12, Revision 18 — renamed)
 *   collecting  ~> {done, warn}                     (L5,  Revision 1)
 *   dedup_error ~> {collecting, done, warn}         (L4,  Revision 5)
 *   writing     ~> {done, warn, collecting}         (L10, Revision 14)
 *
 * Rename history: introduced as BuildingLeadsToCollectingOrDedupError in
 * Revision 16. Revision 17 widened the consequent to include "warn" (the
 * GraphHaltCleanup abort path) but did not update the name. Revision 18
 * corrects the name to match the three-element consequent (T-1 fix).
 *)
BuildingLeadsToCollectingOrDedupErrorOrWarn ==
    (graphState = "building") ~>
        (graphState \in {"collecting", "dedup_error", "warn"})

(*
 * L13: Retrying state eventually advances to building, dedup_error, or warn.
 * (new in Revision 19 — O-1 fix)
 *
 * By the naming pattern established by L8–L12 (one named liveness property per
 * non-terminal state), graphState = "retrying" was the last non-terminal graph
 * state without a dedicated liveness property in L4–L12. From graphState =
 * "retrying", exactly four WF-fair exit actions are enabled (which pair fires
 * depends on pendingKind):
 *   - GraphRetryNodeSuccess        (pendingKind="node") → graphState="building"
 *   - GraphRetryEdgeSuccess        (pendingKind="edge") → graphState="building"
 *   - GraphRetryNodeStillDuplicate (pendingKind="node") → graphState="dedup_error"
 *   - GraphRetryEdgeStillDuplicate (pendingKind="edge") → graphState="dedup_error"
 * Additionally, GraphHaltCleanup (WF-fair) fires whenever pipelineState = "halted"
 * and graphState = "retrying", transitioning directly to graphState = "warn".
 *
 * S27's fourth conjunct (graphState = "retrying" => pendingKind ∈ {"node","edge"})
 * ensures at least one of the two action pairs is always enabled in "retrying",
 * preventing the pendingKind = "none" silent deadlock. L13 names the progress
 * guarantee that was structurally present (WF fairness on all five exit actions)
 * but unnamed. The graph liveness chain is now complete for all non-terminal states:
 *
 *   retrying    ~> {building, dedup_error, warn}       (L13, Revision 19)
 *   building    ~> {collecting, dedup_error, warn}     (L12, Revision 18)
 *   collecting  ~> {done, warn}                       (L5,  Revision 1)
 *   dedup_error ~> {collecting, done, warn}           (L4,  Revision 5)
 *   writing     ~> {done, warn, collecting}           (L10, Revision 14)
 *)
RetryingLeadsToBuildingOrDedupError ==
    (graphState = "retrying") ~>
        (graphState \in {"building", "dedup_error", "warn"})

(*
 * L14: Intercepting state eventually advances to rewriting. (new in Revision 20 — O-1 fix)
 *
 * By the naming pattern established for graphState (L12/L13) and routingState
 * (L9/L11) — one named liveness property per non-terminal state — hookState=
 * "intercepting" was the only hookState non-terminal state without a dedicated
 * named liveness property. L6 (HookEventuallySettles) covers the combined
 * hookState ∈ {"intercepting","rewriting"} antecedent; L14 provides the per-state
 * granularity for "intercepting" specifically, completing the hook liveness chain.
 *
 * From hookState = "intercepting", exactly one WF-fair exit action exists:
 *   - HookRewrite (WF_vars) fires → hookState = "rewriting"
 *
 * HookRewrite has no pipelineState guard (per ASSUME D27: in-progress intercepts
 * complete to their terminal state independently of pipelineState). There is no
 * GraphHaltCleanup analogue for the hook subsystem. HookRewrite's guard is:
 *   hookState = "intercepting" /\ hookCommand /= NULL
 * Both conditions are satisfied whenever hookState = "intercepting" (hookCommand
 * is set atomically by HookInterceptEs/HookInterceptRg before hookState transitions).
 * WF_vars(HookRewrite) guarantees progress.
 *
 * The hook liveness chain is now complete for all non-terminal hookState values:
 *
 *   intercepting ~> rewriting              (L14, Revision 20 — new)
 *   rewriting    ~> {done, error}          (L6,  Revision 1 — supplements L14)
 *
 * L6 (HookEventuallySettles) is retained as the combined end-to-end property and
 * continues to be registered as PROPERTY in the .cfg. L14 is also registered as
 * PROPERTY and provides the per-state granularity matching the graph/routing pattern.
 *)
InterceptingLeadsToRewriting ==
    (hookState = "intercepting") ~> (hookState = "rewriting")

=============================================================================
