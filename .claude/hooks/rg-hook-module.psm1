# rg-hook-module.psm1 — Module version of rg-hook for Pester InModuleScope mocking
# Exports Invoke-RgHookRewrite for test mocking (Test 10 L14 R3)

$script:GrepTokens = @('grep', 'egrep', 'fgrep', 'Select-String', 'sls')
$script:PlainReadTokens = @('Get-Content', 'gc', 'cat')
$script:EsDomainTokens = @('es', 'find', 'ls', 'dir', 'Get-ChildItem', 'gci')

function Invoke-RgHookRewrite {
    param(
        [Parameter(Mandatory)]
        [string]$Command
    )

    $trimmed = $Command.TrimStart()

    foreach ($token in $script:GrepTokens) {
        if ($trimmed -match "^$([regex]::Escape($token))(\s|$|;|\|)") {
            $rewritten = $Command -replace "^(\s*)$([regex]::Escape($token))(\s|$)", '$1rg$2'
            return $rewritten
        }
    }

    foreach ($token in $script:GrepTokens) {
        if ($Command -match "\|\s*$([regex]::Escape($token))(\s|$|;|\|)") {
            $rewritten = $Command -replace "\|\s*$([regex]::Escape($token))(\s|$)", "| rg`$1"
            return $rewritten
        }
    }

    return $Command
}

Export-ModuleMember -Function Invoke-RgHookRewrite
