----------------------- MODULE ProjectManagerAgent -----------------------
EXTENDS Integers, FiniteSets, Sequences, TLC

CONSTANTS
    MaxConcurrent,
    MaxReDispatches,
    MaxFixRetries,
    SessionTimeout,
    TaskIds,
    TierIds,
    AgentRoster,
    VerificationCriteria

ExecutionResult == {
    "SUCCESS",
    "FAILED_LOGIC",
    "FAILED_CORRUPTION",
    "TIMEOUT",
    "VERIFICATION_FAILED",
    "MERGE_CONFLICT",
    "TIER_ALL_FAILED"
}

ErrorCauses == {
    "",
    "No tasks in implementation plan",
    "No agents available in roster",
    "Worktree creation failed",
    "Session exceeded timeout",
    "Corruption detected - full reset required",
    "All sessions in tier failed",
    "Inter-tier verification failed - task-graph defect",
    "Merge fix retries exhausted - rollback",
    "Merge fix retries exhausted"
}

DeveloperError == {
    "NONE",
    "TIER_BLOCKED",
    "TASK_FAILED",
    "MERGE_EXHAUSTED",
    "VERIFICATION_HALT",
    "WORKTREE_FAILED",
    "INPUT_INVALID",
    "SESSION_TIMEOUT"
}

MergeStrategy == {"PER_TASK", "PER_TIER", "DEFERRED"}

ServiceResult == {"OK", "CONFLICT", "NOT_FOUND", "PERMISSION_DENIED", "IO_ERROR"}

PipelineStates == {
    "IDLE",
    "INPUT_VALIDATING",
    "INPUT_VALID",
    "INPUT_INVALID",
    "TIER_EXECUTING",
    "TIER_VERIFYING",
    "TIER_VERIFIED",
    "TIER_FAILED",
    "MERGING",
    "MERGE_ROLLBACK",
    "ALL_TIERS_COMPLETE",
    "HALTED"
}

TerminalStates == {"ALL_TIERS_COMPLETE", "HALTED"}

NonTerminalStates == PipelineStates \ TerminalStates

TaskStates == {
    "PENDING",
    "DISPATCHED",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "RE_DISPATCHING",
    "FIX_SESSION",
    "MERGED",
    "SKIPPED"
}

VARIABLES
    pipelineState,
    currentTier,
    taskState,
    taskTier,
    taskDeps,
    dispatchCount,
    fixRetryCount,
    executionResult,
    developerError,
    errorTier,
    errorTask,
    errorCause,
    worktreeActive,
    mergeState,
    pipelineStateLocked,
    sessionActive,
    sessionTicks,
    verifiedCriteria,
    gitServiceResult,
    agentDispatchResult,
    mergedTasks

vars == <<
    pipelineState, currentTier, taskState, taskTier, taskDeps,
    dispatchCount, fixRetryCount, executionResult, developerError,
    errorTier, errorTask, errorCause, worktreeActive, mergeState,
    pipelineStateLocked, sessionActive, sessionTicks, verifiedCriteria,
    gitServiceResult, agentDispatchResult, mergedTasks
>>

TypeOK ==
    /\ pipelineState \in PipelineStates
    /\ currentTier \in TierIds \cup {0}
    /\ taskState \in [TaskIds -> TaskStates]
    /\ taskTier \in [TaskIds -> TierIds]
    /\ taskDeps \in [TaskIds -> SUBSET TaskIds]
    /\ dispatchCount \in [TaskIds -> 0..MaxReDispatches + 1]
    /\ fixRetryCount \in [TaskIds -> 0..MaxFixRetries + 1]
    /\ executionResult \in [TaskIds -> ExecutionResult]
    /\ developerError \in DeveloperError
    /\ errorTier \in TierIds \cup {0}
    /\ errorTask \in TaskIds \cup {"NONE"}
    /\ errorCause \in ErrorCauses
    /\ worktreeActive \in [TaskIds -> BOOLEAN]
    /\ mergeState \in [TaskIds -> {"NONE", "PENDING", "MERGED", "CONFLICT", "ROLLED_BACK"}]
    /\ pipelineStateLocked \in BOOLEAN
    /\ sessionActive \in [TaskIds -> BOOLEAN]
    /\ sessionTicks \in [TaskIds -> 0..SessionTimeout + 1]
    /\ verifiedCriteria \in [TaskIds -> SUBSET VerificationCriteria]
    /\ gitServiceResult \in ServiceResult
    /\ agentDispatchResult \in ServiceResult
    /\ mergedTasks \subseteq TaskIds

Init ==
    /\ pipelineState = "IDLE"
    /\ currentTier = 0
    /\ taskState = [t \in TaskIds |-> "PENDING"]
    /\ taskTier \in [TaskIds -> TierIds]
    /\ taskDeps = [t \in TaskIds |-> {}]
    /\ dispatchCount = [t \in TaskIds |-> 0]
    /\ fixRetryCount = [t \in TaskIds |-> 0]
    /\ executionResult = [t \in TaskIds |-> "SUCCESS"]
    /\ developerError = "NONE"
    /\ errorTier = 0
    /\ errorTask = "NONE"
    /\ errorCause = ""
    /\ worktreeActive = [t \in TaskIds |-> FALSE]
    /\ mergeState = [t \in TaskIds |-> "NONE"]
    /\ pipelineStateLocked = FALSE
    /\ sessionActive = [t \in TaskIds |-> FALSE]
    /\ sessionTicks = [t \in TaskIds |-> 0]
    /\ verifiedCriteria = [t \in TaskIds |-> {}]
    /\ gitServiceResult = "OK"
    /\ agentDispatchResult = "OK"
    /\ mergedTasks = {}

ValidateInputs ==
    /\ pipelineState = "IDLE"
    /\ pipelineStateLocked = FALSE
    /\ pipelineState' = "INPUT_VALIDATING"
    /\ pipelineStateLocked' = TRUE
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks, currentTier>>

InputsValid ==
    /\ pipelineState = "INPUT_VALIDATING"
    /\ TaskIds /= {}
    /\ AgentRoster /= {}
    /\ pipelineState' = "INPUT_VALID"
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks, currentTier,
                   pipelineStateLocked>>

InputsInvalid ==
    /\ pipelineState = "INPUT_VALIDATING"
    /\ \/ TaskIds = {}
       \/ AgentRoster = {}
    /\ pipelineState' = "INPUT_INVALID"
    /\ developerError' = "INPUT_INVALID"
    /\ errorCause' = IF TaskIds = {} THEN "No tasks in implementation plan"
                     ELSE "No agents available in roster"
    /\ errorTier' = 0
    /\ errorTask' = "NONE"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks, currentTier>>

HaltPipeline ==
    /\ pipelineState \in NonTerminalStates
    /\ pipelineState \notin {"INPUT_VALIDATING"}
    /\ pipelineState' = "HALTED"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState,
                   sessionActive, sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

\* Guard lock actions to only fire in states where lock management is meaningful
\* (not in failed or terminal states where no further work happens)
LockableStates == (PipelineStates \ TerminalStates) \ {"TIER_FAILED", "INPUT_INVALID"}

AcquireStateLock ==
    /\ pipelineStateLocked = FALSE
    /\ pipelineState \in LockableStates
    /\ pipelineStateLocked' = TRUE
    /\ UNCHANGED <<pipelineState, currentTier, taskState, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, worktreeActive, mergeState,
                   sessionActive, sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

ReleaseStateLock ==
    /\ pipelineStateLocked = TRUE
    /\ pipelineState \in LockableStates
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<pipelineState, currentTier, taskState, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, worktreeActive, mergeState,
                   sessionActive, sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

StartNextTier ==
    /\ pipelineState = "INPUT_VALID"
    /\ currentTier \in TierIds
    /\ \A t \in TaskIds : (taskTier[t] = currentTier) => taskState[t] = "PENDING"
    /\ pipelineState' = "TIER_EXECUTING"
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

AdvanceTier ==
    /\ pipelineState = "TIER_VERIFIED"
    /\ currentTier \in TierIds
    /\ LET NextTier(t) == CHOOSE n \in TierIds : n > t
       IN currentTier' = NextTier(currentTier)
    /\ pipelineState' = "TIER_EXECUTING"
    /\ \A t \in TaskIds :
        (taskTier[t] = currentTier') => taskState'[t] = "PENDING"
    /\ UNCHANGED <<taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

CreateWorktree(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "PENDING"
    /\ worktreeActive[task] = FALSE
    /\ gitServiceResult' = "OK"
    /\ worktreeActive' = [worktreeActive EXCEPT ![task] = TRUE]
    /\ taskState' = [taskState EXCEPT ![task] = "DISPATCHED"]
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, mergeState,
                   pipelineStateLocked, sessionActive, sessionTicks,
                   verifiedCriteria, agentDispatchResult, mergedTasks>>

CreateWorktreeFails(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "PENDING"
    /\ worktreeActive[task] = FALSE
    /\ gitServiceResult' = "IO_ERROR"
    /\ developerError' = "WORKTREE_FAILED"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Worktree creation failed"
    /\ pipelineState' = "HALTED"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, agentDispatchResult,
                   mergedTasks, currentTier>>

DispatchAgentPair(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "DISPATCHED"
    /\ dispatchCount[task] < MaxReDispatches
    /\ \A dep \in taskDeps[task] : taskState[dep] \in {"COMPLETED", "MERGED", "SKIPPED"}
    /\ dispatchCount' = [dispatchCount EXCEPT ![task] = @ + 1]
    /\ taskState' = [taskState EXCEPT ![task] = "RUNNING"]
    /\ sessionActive' = [sessionActive EXCEPT ![task] = TRUE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ agentDispatchResult' = "OK"
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, pipelineStateLocked,
                   verifiedCriteria, gitServiceResult, mergedTasks>>

SessionTick(task) ==
    /\ task \in TaskIds
    /\ pipelineState = "TIER_EXECUTING"
    /\ sessionActive[task] = TRUE
    /\ sessionTicks[task] < SessionTimeout
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = @ + 1]
    /\ UNCHANGED <<pipelineState, currentTier, taskState, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, worktreeActive, mergeState,
                   pipelineStateLocked, sessionActive, verifiedCriteria,
                   gitServiceResult, agentDispatchResult, mergedTasks>>

SessionTimeoutExpired(task) ==
    /\ task \in TaskIds
    /\ sessionActive[task] = TRUE
    /\ sessionTicks[task] >= SessionTimeout
    /\ sessionActive' = [sessionActive EXCEPT ![task] = FALSE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ executionResult' = [executionResult EXCEPT ![task] = "TIMEOUT"]
    /\ taskState' = [taskState EXCEPT ![task] = "FAILED"]
    /\ developerError' = "SESSION_TIMEOUT"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Session exceeded timeout"
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, worktreeActive, mergeState,
                   pipelineStateLocked, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

TaskSucceed(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "RUNNING"
    /\ sessionActive[task] = TRUE
    /\ sessionActive' = [sessionActive EXCEPT ![task] = FALSE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ taskState' = [taskState EXCEPT ![task] = "COMPLETED"]
    /\ executionResult' = [executionResult EXCEPT ![task] = "SUCCESS"]
    /\ mergeState' = [mergeState EXCEPT ![task] = "PENDING"]
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, pipelineStateLocked,
                   verifiedCriteria, gitServiceResult, agentDispatchResult,
                   mergedTasks>>

TaskFailLogic(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "RUNNING"
    /\ sessionActive[task] = TRUE
    /\ dispatchCount[task] < MaxReDispatches
    /\ sessionActive' = [sessionActive EXCEPT ![task] = FALSE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ executionResult' = [executionResult EXCEPT ![task] = "FAILED_LOGIC"]
    /\ taskState' = [taskState EXCEPT ![task] = "RE_DISPATCHING"]
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState,
                   pipelineStateLocked, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

TaskFailCorruption(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "RUNNING"
    /\ sessionActive[task] = TRUE
    /\ sessionActive' = [sessionActive EXCEPT ![task] = FALSE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ executionResult' = [executionResult EXCEPT ![task] = "FAILED_CORRUPTION"]
    /\ taskState' = [taskState EXCEPT ![task] = "FAILED"]
    /\ developerError' = "TASK_FAILED"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Corruption detected - full reset required"
    /\ pipelineState' = "HALTED"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<currentTier, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   worktreeActive, mergeState, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

ReDispatch(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "RE_DISPATCHING"
    /\ dispatchCount[task] < MaxReDispatches
    /\ dispatchCount' = [dispatchCount EXCEPT ![task] = @ + 1]
    /\ taskState' = [taskState EXCEPT ![task] = "RUNNING"]
    /\ sessionActive' = [sessionActive EXCEPT ![task] = TRUE]
    /\ sessionTicks' = [sessionTicks EXCEPT ![task] = 0]
    /\ executionResult' = [executionResult EXCEPT ![task] = "SUCCESS"]
    /\ agentDispatchResult' = "OK"
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps, fixRetryCount,
                   developerError, errorTier, errorTask, errorCause,
                   worktreeActive, mergeState, pipelineStateLocked,
                   verifiedCriteria, gitServiceResult, mergedTasks>>

TierAllFailed ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ \A task \in TaskIds :
        (taskTier[task] = currentTier) =>
            taskState[task] \in {"FAILED", "RE_DISPATCHING"}
            /\ dispatchCount[task] >= MaxReDispatches
    /\ pipelineState' = "TIER_FAILED"
    /\ developerError' = "TIER_BLOCKED"
    /\ errorTier' = currentTier
    /\ errorTask' = "NONE"
    /\ errorCause' = "All sessions in tier failed"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks, currentTier>>

RunVerification(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "COMPLETED"
    /\ verifiedCriteria[task] /= VerificationCriteria
    /\ \E c \in VerificationCriteria : c \notin verifiedCriteria[task]
    /\ verifiedCriteria' = [verifiedCriteria EXCEPT ![task] =
        @ \cup {CHOOSE c \in VerificationCriteria : c \notin verifiedCriteria[task]}]
    /\ UNCHANGED <<pipelineState, currentTier, taskState, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, worktreeActive, mergeState,
                   pipelineStateLocked, sessionActive, sessionTicks,
                   gitServiceResult, agentDispatchResult, mergedTasks>>

VerificationPass ==
    /\ pipelineState = "TIER_VERIFYING"
    /\ \A task \in TaskIds :
        (taskTier[task] = currentTier /\ taskState[task] = "COMPLETED")
            => verifiedCriteria[task] = VerificationCriteria
    /\ pipelineState' = "TIER_VERIFIED"
    /\ UNCHANGED <<taskState, taskTier, taskDeps, dispatchCount, fixRetryCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks, currentTier>>

VerificationFail(task) ==
    /\ task \in TaskIds
    /\ pipelineState = "TIER_EXECUTING"
    /\ taskState[task] = "COMPLETED"
    /\ verifiedCriteria[task] /= VerificationCriteria
    /\ \A t \in TaskIds :
        (taskTier[t] = currentTier /\ taskState[t] = "COMPLETED")
            => verifiedCriteria[t] /= VerificationCriteria
    /\ \A t \in TaskIds :
        (taskTier[t] = currentTier) => ~sessionActive[t]
    /\ pipelineState' = "HALTED"
    /\ developerError' = "VERIFICATION_HALT"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Inter-tier verification failed - task-graph defect"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, worktreeActive, mergeState,
                   sessionActive, sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

MergeTask(task) ==
    /\ task \in TaskIds
    /\ mergeState[task] = "PENDING"
    /\ taskState[task] = "COMPLETED"
    /\ verifiedCriteria[task] = VerificationCriteria
    /\ MergeStrategy \in {"PER_TASK", "PER_TIER", "DEFERRED"}
    /\ gitServiceResult' = "OK"
    /\ mergeState' = [mergeState EXCEPT ![task] = "MERGED"]
    /\ mergedTasks' = mergedTasks \cup {task}
    /\ UNCHANGED <<pipelineState, currentTier, taskState, taskTier, taskDeps,
                   dispatchCount, fixRetryCount, executionResult, developerError,
                   errorTier, errorTask, errorCause, worktreeActive,
                   pipelineStateLocked, sessionActive, sessionTicks,
                   verifiedCriteria, agentDispatchResult>>

MergeConflict(task) ==
    /\ task \in TaskIds
    /\ mergeState[task] = "PENDING"
    /\ fixRetryCount[task] < MaxFixRetries
    /\ gitServiceResult' = "CONFLICT"
    /\ mergeState' = [mergeState EXCEPT ![task] = "CONFLICT"]
    /\ fixRetryCount' = [fixRetryCount EXCEPT ![task] = @ + 1]
    /\ taskState' = [taskState EXCEPT ![task] = "FIX_SESSION"]
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps, dispatchCount,
                   executionResult, developerError, errorTier, errorTask,
                   errorCause, worktreeActive, pipelineStateLocked, sessionActive,
                   sessionTicks, verifiedCriteria, agentDispatchResult, mergedTasks>>

RollbackMerge(task) ==
    /\ task \in TaskIds
    /\ mergeState[task] \in {"MERGED", "CONFLICT"}
    /\ fixRetryCount[task] >= MaxFixRetries
    /\ pipelineState \notin TerminalStates
    /\ gitServiceResult' = "OK"
    /\ mergeState' = [mergeState EXCEPT ![task] = "ROLLED_BACK"]
    /\ mergedTasks' = mergedTasks \ {task}
    /\ pipelineState' = "TIER_FAILED"
    /\ developerError' = "MERGE_EXHAUSTED"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Merge fix retries exhausted - rollback"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, worktreeActive, sessionActive,
                   sessionTicks, verifiedCriteria, agentDispatchResult>>

FixSessionSucceed(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "FIX_SESSION"
    /\ taskState' = [taskState EXCEPT ![task] = "COMPLETED"]
    /\ mergeState' = [mergeState EXCEPT ![task] = "PENDING"]
    /\ gitServiceResult' = "OK"
    /\ UNCHANGED <<pipelineState, currentTier, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, pipelineStateLocked,
                   sessionActive, sessionTicks, verifiedCriteria,
                   agentDispatchResult, mergedTasks>>

FixSessionFail(task) ==
    /\ task \in TaskIds
    /\ taskState[task] = "FIX_SESSION"
    /\ fixRetryCount[task] >= MaxFixRetries
    /\ pipelineState' = "HALTED"
    /\ developerError' = "MERGE_EXHAUSTED"
    /\ errorTier' = currentTier
    /\ errorTask' = task
    /\ errorCause' = "Merge fix retries exhausted"
    /\ pipelineStateLocked' = FALSE
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, worktreeActive, mergeState,
                   sessionActive, sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

AllTiersComplete ==
    /\ pipelineState = "TIER_VERIFIED"
    /\ \A task \in TaskIds :
        /\ taskState[task] \in {"COMPLETED", "MERGED", "SKIPPED"}
        /\ mergeState[task] \in {"MERGED", "NONE"}
    /\ pipelineState' = "ALL_TIERS_COMPLETE"
    /\ pipelineStateLocked' = FALSE
    /\ developerError' = "NONE"
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, errorTier, errorTask,
                   errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

BeginTierVerification ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ \A t \in TaskIds :
        (taskTier[t] = currentTier) => taskState[t] \in {"COMPLETED", "FAILED", "SKIPPED"}
    /\ \A t \in TaskIds :
        (taskTier[t] = currentTier) => ~sessionActive[t]
    /\ pipelineState' = "TIER_VERIFYING"
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

BeginMerging ==
    /\ pipelineState = "TIER_VERIFIED"
    /\ \E t \in TaskIds : mergeState[t] = "PENDING"
    /\ pipelineState' = "MERGING"
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

BeginRollback ==
    /\ pipelineState = "MERGING"
    /\ \E t \in TaskIds :
        mergeState[t] = "CONFLICT" /\ fixRetryCount[t] >= MaxFixRetries
    /\ pipelineState' = "MERGE_ROLLBACK"
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

AfterMergeComplete ==
    /\ pipelineState = "MERGING"
    /\ \A t \in TaskIds : mergeState[t] /= "PENDING"
    /\ \A t \in TaskIds : mergeState[t] \in {"MERGED", "NONE"}
    /\ pipelineState' = "TIER_EXECUTING"
    /\ UNCHANGED <<currentTier, taskState, taskTier, taskDeps, dispatchCount,
                   fixRetryCount, executionResult, developerError, errorTier,
                   errorTask, errorCause, worktreeActive, mergeState, sessionActive,
                   sessionTicks, verifiedCriteria, gitServiceResult,
                   agentDispatchResult, mergedTasks>>

Terminated ==
    /\ pipelineState \in TerminalStates
    /\ UNCHANGED vars

Next ==
    \/ ValidateInputs
    \/ InputsValid
    \/ InputsInvalid
    \/ AcquireStateLock
    \/ ReleaseStateLock
    \/ StartNextTier
    \/ AdvanceTier
    \/ \E task \in TaskIds : CreateWorktree(task)
    \/ \E task \in TaskIds : CreateWorktreeFails(task)
    \/ \E task \in TaskIds : DispatchAgentPair(task)
    \/ \E task \in TaskIds : SessionTick(task)
    \/ \E task \in TaskIds : SessionTimeoutExpired(task)
    \/ \E task \in TaskIds : TaskSucceed(task)
    \/ \E task \in TaskIds : TaskFailLogic(task)
    \/ \E task \in TaskIds : TaskFailCorruption(task)
    \/ \E task \in TaskIds : ReDispatch(task)
    \/ TierAllFailed
    \/ \E task \in TaskIds : RunVerification(task)
    \/ VerificationPass
    \/ \E task \in TaskIds : VerificationFail(task)
    \/ \E task \in TaskIds : MergeTask(task)
    \/ \E task \in TaskIds : MergeConflict(task)
    \/ \E task \in TaskIds : RollbackMerge(task)
    \/ \E task \in TaskIds : FixSessionSucceed(task)
    \/ \E task \in TaskIds : FixSessionFail(task)
    \/ BeginTierVerification
    \/ BeginMerging
    \/ BeginRollback
    \/ AfterMergeComplete
    \/ AllTiersComplete
    \/ HaltPipeline
    \/ Terminated

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

DispatchBounded ==
    \A t \in TaskIds : dispatchCount[t] <= MaxReDispatches

FixRetryBounded ==
    \A t \in TaskIds : fixRetryCount[t] <= MaxFixRetries

SessionTimeoutEnforced ==
    \A t \in TaskIds :
        sessionActive[t] => sessionTicks[t] <= SessionTimeout

ErrorObservability ==
    (developerError /= "NONE") =>
        /\ errorCause /= ""
        /\ (errorTier /= 0 \/ errorTask /= "NONE")

MergeAfterCompletion ==
    \A t \in TaskIds :
        mergeState[t] \in {"MERGED"} => taskState[t] \in {"COMPLETED", "MERGED"}

VerificationBeforeAdvance ==
    (pipelineState = "TIER_VERIFIED") =>
        \A t \in TaskIds :
            (taskTier[t] = currentTier /\ taskState[t] = "COMPLETED")
                => verifiedCriteria[t] = VerificationCriteria

CorruptionHaltsImmediately ==
    (\E t \in TaskIds : executionResult[t] = "FAILED_CORRUPTION")
        => pipelineState = "HALTED"

NoReDispatchAfterCorruption ==
    \A t \in TaskIds :
        executionResult[t] = "FAILED_CORRUPTION" => taskState[t] = "FAILED"

MergedTasksSubset ==
    mergedTasks \subseteq {t \in TaskIds : taskState[t] \in {"COMPLETED", "MERGED"}}

ConcurrentSessionsBounded ==
    Cardinality({t \in TaskIds : sessionActive[t]}) <= MaxConcurrent

EventuallyTerminal ==
    (pipelineState \in NonTerminalStates) ~> (pipelineState \in TerminalStates)

SessionProgress ==
    (\E t \in TaskIds : sessionActive[t])
        ~> (\A t \in TaskIds : ~sessionActive[t])

TaskEventuallyTerminal ==
    \A t \in TaskIds :
        taskState[t] = "PENDING" ~> taskState[t] \in {"COMPLETED", "FAILED", "SKIPPED"}

EventuallyComplete ==
    (pipelineState = "INPUT_VALID") ~> (pipelineState = "ALL_TIERS_COMPLETE")

=============================================================================
