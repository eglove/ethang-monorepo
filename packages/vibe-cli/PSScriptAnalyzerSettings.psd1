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
    )
}
