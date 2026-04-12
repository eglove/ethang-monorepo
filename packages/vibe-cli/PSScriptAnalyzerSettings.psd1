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
    )
}
