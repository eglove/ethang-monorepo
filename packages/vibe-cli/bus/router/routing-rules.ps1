$_routerDir = $PSScriptRoot
$_routingRulesPath = Join-Path $_routerDir 'routing-rules.psd1'
function _Get-RoutingRules { Import-PowerShellDataFile -Path $_routingRulesPath }
function Test-TypeSenderACL {
    param([string]$SenderRole, [string]$EventType)
    $data = Import-PowerShellDataFile "$PSScriptRoot/../event-types/event-types.psd1"
    if (-not $data.TypeSenderACL.ContainsKey($EventType)) { return $false }
    return $data.TypeSenderACL[$EventType] -contains $SenderRole
}
function Resolve-EventTarget {
    param([string]$EventType, [string]$ExplicitTo=$null, [string]$ActiveModeratorName=$null, [string]$SenderName=$null)
    $rules = _Get-RoutingRules
    if ($rules.BroadcastEvents -contains $EventType) { return 'broadcast' }
    if ($rules.InferredTargets.ContainsKey($EventType)) {
        $inf = $rules.InferredTargets[$EventType]
        switch ($inf) { 'moderator' { return $ActiveModeratorName } 'sender' { return $SenderName } default { return $inf } }
    }
    if ($rules.ExplicitTargetRequired -contains $EventType) {
        if ([string]::IsNullOrEmpty($ExplicitTo)) { throw "EventType '$EventType' requires explicit 'to'" }
        return $ExplicitTo
    }
    throw "EventType '$EventType' not recognized"
}
