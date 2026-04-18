@{
    # TLA+ variable name → PowerShell name mappings
    NameMap = @{
        nextEvtId                    = '$NextEventId'
        eventLog                     = 'event_log (SQLite) / $EventHistory (in-memory)'
        routedIds                    = '$DispatchedIds'
        busStatus                    = '$BusLifecycleState'
        commitLockHolder             = '$CommitOwner'
        consensusRoundStart          = '$RoundEpoch'
        handlerPendingEpoch          = '$HandlerEpoch'
        groundTruthDelivered         = '$ContextDelivered'
        spawnedAtEvt                 = '$SpawnEpoch'
        deadAtEvt                    = '$DeathEpoch'
        pipeline_lock                = '$PipelineLock'
        agentStatus                  = '$AgentLifecycleStatus'
        agentWorktree                = '$AgentWorktreePath'
        checkpointStored             = '$CheckpointStored'
        checkpointResponseInFlight   = '$CheckpointResponseInFlight'
        unresolvedObjections         = '$UnresolvedObjections'
        overriddenObjections         = '$OverriddenObjections'
        consensusState               = '$ConsensusState'
        committedDoneEvts            = '$CommittedDoneEvents'
        pendingDoneEvt               = '$PendingDoneEvent'
        haltReason                   = '$HaltReason'
        failureCategory              = '$FailureCategory'
        groupMembers                 = '$GroupMembers'
        groupReplies                 = '$GroupReplies'
        groupViolationPending        = '$GroupViolationPending'
        pendingProtocolError         = '$PendingProtocolError'
        handlerState                 = '$HandlerState'
        handlerPendingEvt            = '$HandlerPendingEvent'
        handlerPendingAgent          = '$HandlerPendingAgent'
        snapshotExists               = '$SnapshotExists'
        rollbackRequested            = '$RollbackRequested'
        rollbackTargetWorktree       = '$RollbackTargetWorktree'
    }

    # All TLA+ variable names that must never appear as PowerShell identifiers
    TlaVariables = @(
        'nextEvtId'
        'eventLog'
        'routedIds'
        'agentStatus'
        'agentWorktree'
        'checkpointStored'
        'checkpointResponseInFlight'
        'groundTruthDelivered'
        'spawnedAtEvt'
        'deadAtEvt'
        'unresolvedObjections'
        'overriddenObjections'
        'consensusState'
        'commitLockHolder'
        'committedDoneEvts'
        'pendingDoneEvt'
        'busStatus'
        'haltReason'
        'failureCategory'
        'groupMembers'
        'groupReplies'
        'groupViolationPending'
        'pendingProtocolError'
        'handlerState'
        'handlerPendingEvt'
        'handlerPendingAgent'
        'handlerPendingEpoch'
        'consensusRoundStart'
        'pipeline_lock'
        'snapshotExists'
        'rollbackRequested'
        'rollbackTargetWorktree'
    )

    # BDD tag schema — required tag patterns for Scenario blocks
    BddTagSchema = @{
        TlaActionPattern  = '@tla-action-<ActionName>'
        InvariantPattern  = '@invariant-M'
        NoneTag           = '@tla-action-none'
        NoneReasonTag     = '@tla-action-none-reason="<token>"'
    }

    # TLA+ action names → canonical BDD tags
    TlaActionNamedTags = @{
        RouterHaltsFeatureComplete   = '@tla-action-RouterHaltsFeatureComplete'
        RouterHaltsError             = '@tla-action-RouterHaltsError'
        RouterDispatch               = '@tla-action-RouterDispatch'
        AgentBootstrap               = '@tla-action-AgentBootstrap'
        AgentDone                    = '@tla-action-AgentDone'
        AgentCheckpoint              = '@tla-action-AgentCheckpoint'
        AgentCheckpointResponse      = '@tla-action-AgentCheckpointResponse'
        ObjectionRaise               = '@tla-action-ObjectionRaise'
        ObjectionRespond             = '@tla-action-ObjectionRespond'
        ConsensusVote                = '@tla-action-ConsensusVote'
        ConsensusRatify              = '@tla-action-ConsensusRatify'
        ConsensusFail                = '@tla-action-ConsensusFail'
        VerificationRequest          = '@tla-action-VerificationRequest'
        VerificationResult           = '@tla-action-VerificationResult'
        ReviewRequest                = '@tla-action-ReviewRequest'
        ReviewVerdict                = '@tla-action-ReviewVerdict'
        ProtocolErrorRaise           = '@tla-action-ProtocolErrorRaise'
        ProtocolErrorAck             = '@tla-action-ProtocolErrorAck'
    }

    # Observable postconditions per TLA+ action
    ObservablePostConditions = @{
        RouterHaltsFeatureComplete = @(
            'bus status is halted'
            'halt reason is feature_complete'
        )
        RouterHaltsError = @(
            'bus status is halted'
            'halt reason is error'
        )
        AgentDone = @(
            'done event is emitted'
            'agent status is done'
        )
        ConsensusRatify = @(
            'consensus state is ratified'
            'consensus_ratified event is published'
        )
        ConsensusFail = @(
            'consensus state is failed'
            'consensus_failed event is published'
        )
    }
}
