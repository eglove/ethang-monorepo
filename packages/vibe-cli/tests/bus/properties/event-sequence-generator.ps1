# event-sequence-generator.ps1
# Generates valid random event sequences for property-based bus router tests.
# Invariant validators are also defined here.

# ---------------------------------------------------------------------------
# ACL tables — derived from TLA+ TypeSenderACL invariant
# ---------------------------------------------------------------------------

# Valid From roles per event type
$script:_AclFromRole = @{
    'bootstrap'          = @('router')
    'ground_truth'       = @('router')
    'checkpoint'         = @('router')
    'protocol_error'     = @('router')
    'consensus_ratified' = @('router')
    'consensus_failed'   = @('router')
    'done'               = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'objection'          = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'objection_response' = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'consensus_candidate'= @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'checkpoint_response'= @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'protocol_error_ack' = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_requested'   = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_verdict'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify'             = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify_result'      = @('tlc', 'tests', 'git')
}

# Valid To roles per event type
$script:_AclToRole = @{
    'bootstrap'          = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'ground_truth'       = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'checkpoint'         = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'protocol_error'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'verify_result'      = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'review_verdict'     = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer')
    'done'               = @('router')
    'objection'          = @('router')
    'objection_response' = @('router')
    'consensus_candidate'= @('router')
    'checkpoint_response'= @('router')
    'protocol_error_ack' = @('router')
    'consensus_ratified' = @('broadcast')
    'consensus_failed'   = @('broadcast')
    'verify'             = @('tlc', 'tests', 'git')
    'review_requested'   = @('writer', 'reviewer', 'moderator', 'tla-writer', 'tla-reviewer', 'broadcast')
}

$script:_AllEventTypes = @(
    'bootstrap', 'ground_truth', 'done', 'objection', 'objection_response',
    'consensus_candidate', 'consensus_ratified', 'consensus_failed',
    'verify', 'verify_result', 'review_requested', 'review_verdict',
    'checkpoint', 'checkpoint_response', 'protocol_error', 'protocol_error_ack'
)

# ---------------------------------------------------------------------------
# Get-ValidEventTypes
# Returns all 16 event types defined in TLA+ EventTypes.
# ---------------------------------------------------------------------------
function Get-ValidEventTypes {
    return $script:_AllEventTypes
}

# ---------------------------------------------------------------------------
# New-ValidEnvelope
# Creates a valid envelope for a given event type with valid From/To roles.
# ---------------------------------------------------------------------------
function New-ValidEnvelope {
    param(
        [Parameter(Mandatory)]
        [string]$EventType,
        [System.Random]$Rng = $null
    )

    if (-not $script:_AclFromRole.ContainsKey($EventType)) {
        throw "Unknown event type: $EventType"
    }

    $_rng = if ($Rng) { $Rng } else { [System.Random]::new() }

    $fromList = $script:_AclFromRole[$EventType]
    $toList   = $script:_AclToRole[$EventType]

    $from = $fromList[$_rng.Next(0, $fromList.Count)]
    $to   = $toList[$_rng.Next(0, $toList.Count)]

    return @{
        EventType = $EventType
        From      = $from
        To        = $to
        Payload   = @{ seq = $_rng.Next(1, 9999) }
        Timestamp = [datetime]::UtcNow.ToString('o')
    }
}

# ---------------------------------------------------------------------------
# New-RandomEventSequence
# Generates a list of valid event hashtables.
# ---------------------------------------------------------------------------
function New-RandomEventSequence {
    param(
        [int]$Length = 10,
        [string[]]$AllowedTypes = $null,
        [int]$Seed = -1
    )

    $rng = if ($Seed -ge 0) { [System.Random]::new($Seed) } else { [System.Random]::new() }

    $types = if ($AllowedTypes -and $AllowedTypes.Count -gt 0) {
        $AllowedTypes
    } else {
        # Exclude halt events (consensus_ratified, consensus_failed) and protocol_error
        # from the default random pool so sequences are appendable without triggering
        # the halt latch mid-sequence.  Tests that need halt events pass AllowedTypes explicitly.
        $script:_AllEventTypes | Where-Object {
            $_ -notin @('consensus_ratified', 'consensus_failed', 'protocol_error')
        }
    }

    $sequence = [System.Collections.Generic.List[hashtable]]::new()

    for ($i = 0; $i -lt $Length; $i++) {
        $type = $types[$rng.Next(0, $types.Count)]
        $envelope = New-ValidEnvelope -EventType $type -Rng $rng
        $sequence.Add($envelope)
    }

    return $sequence.ToArray()
}

# ---------------------------------------------------------------------------
# Assert-SequenceInvariant
# Validates a named invariant holds for a given sequence.
# Returns $true on success; throws on violation.
# ---------------------------------------------------------------------------
function Assert-SequenceInvariant {
    param(
        [Parameter(Mandatory)]
        [hashtable[]]$Events,

        [Parameter(Mandatory)]
        [string]$Invariant
    )

    switch ($Invariant) {

        'InvEventIds' {
            # All evt_ids are unique within the sequence (uses EvtId field if present)
            $ids = $Events | Where-Object { $_.ContainsKey('EvtId') } | ForEach-Object { $_.EvtId }
            $unique = $ids | Sort-Object -Unique
            if ($ids.Count -ne $unique.Count) {
                throw "InvEventIds violated: duplicate evt_ids found in sequence"
            }
            return $true
        }

        'InvStatusTransition' {
            # Status only goes routed->committed or routed->delivery_failed
            foreach ($ev in $Events) {
                if ($ev.ContainsKey('Status')) {
                    $st = $ev.Status
                    if ($st -notin @('routed', 'committed', 'delivery_failed')) {
                        throw "InvStatusTransition violated: invalid status '$st'"
                    }
                }
            }
            return $true
        }

        'InvAclCompliant' {
            foreach ($ev in $Events) {
                $type = $ev.EventType
                $from = $ev.From
                $to   = $ev.To

                if (-not $script:_AclFromRole.ContainsKey($type)) {
                    throw "InvAclCompliant violated: unknown event type '$type'"
                }

                $validFrom = $script:_AclFromRole[$type]
                $validTo   = $script:_AclToRole[$type]

                if ($from -notin $validFrom) {
                    throw "InvAclCompliant violated: From='$from' not allowed for type='$type' (allowed: $($validFrom -join ','))"
                }

                if ($to -notin $validTo) {
                    throw "InvAclCompliant violated: To='$to' not allowed for type='$type' (allowed: $($validTo -join ','))"
                }
            }
            return $true
        }

        'InvHaltMonotone' {
            $haltTypes = @('consensus_ratified', 'consensus_failed')
            $sawHalt = $false
            foreach ($ev in $Events) {
                if ($ev.EventType -in $haltTypes) {
                    $sawHalt = $true
                } elseif ($sawHalt -and $ev.EventType -notin $haltTypes) {
                    throw "InvHaltMonotone violated: non-halt event '$($ev.EventType)' appeared after halt event"
                }
            }
            return $true
        }

        default {
            throw "Unknown invariant: '$Invariant'"
        }
    }
}
