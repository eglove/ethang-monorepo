@{
    ExcludeRules = @(
        # Write-Host is intentional for CLI progress output
        'PSAvoidUsingWriteHost'

        # Global vars needed for cross-runspace communication (ForEach-Object -Parallel)
        'PSAvoidGlobalVars'

        # $Config and $resultText are used across dot-source boundaries
        'PSUseDeclaredVarsMoreThanAssignments'

        # Closure params ($Briefing, $TlaDir, $ImplJson) used inside .GetNewClosure() scriptblocks
        'PSReviewUnusedParameter'

        # Internal CLI functions — OutputType annotations and ShouldProcess support not needed
        'PSUseOutputTypeCorrectly'
        'PSUseShouldProcessForStateChangingFunctions'

        # Intentional empty catches in cleanup/teardown code throughout the pipeline
        'PSAvoidUsingEmptyCatchBlock'

        # False positives: Start-ThreadJob scriptblocks use param() + -ArgumentList, not $Using:
        'PSUseUsingScopeModifierInNewRunspaces'

        # UTF-8 without BOM is the repo standard; 66 files contain em-dashes and box-drawing
        # characters in comments but the tooling chain (git, pwsh, editors) handles UTF-8 fine.
        'PSUseBOMForUnicodeEncodedFile'

        # $Event is a domain-meaningful parameter/variable throughout the bus (event envelopes,
        # event_log rows). Renaming to avoid collision with PS's $Event automatic would obscure
        # the protocol semantics. $args in scriptblock params is idiomatic (param($a) -> $args
        # inner form used by _Invoke-Git closure).
        'PSAvoidAssignmentToAutomaticVariable'

        # Join-Path is used positionally throughout the codebase and by PowerShell convention.
        # The rule is Information severity and fighting it adds noise without safety benefit.
        'PSAvoidUsingPositionalParameters'

        # Internal helpers prefix with underscore (_Invoke-ConsensusQuery, _OpenConn, _Get-*,
        # _Set-*) to signal privacy; PowerShell's approved-verb list doesn't accommodate the
        # underscore-prefixed internal helper convention used in this codebase.
        'PSUseApprovedVerbs'

        # Collection-returning functions (Get-AliveSessions, Get-UncommittedEvents,
        # Get-ProtocolErrorCodes, Test-RoutingRules, etc.) are plural by domain design — a
        # singular variant would return a different thing.
        'PSUseSingularNouns'
    )
}
