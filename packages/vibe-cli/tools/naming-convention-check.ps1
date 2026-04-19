<#
.SYNOPSIS
    Verifies private functions use _PascalCase prefix, public use Verb-Noun pattern.
.PARAMETER WhatIf
    Reports what would happen without failing.
#>
param(
    [switch]$WhatIf
)

$Root = Join-Path $PSScriptRoot '..'
$SearchDirs = @(
    (Join-Path $Root 'bus'),
    (Join-Path $Root 'stages'),
    (Join-Path $Root 'utils'),
    (Join-Path $Root 'tools')
)

$approvedVerbs = @(
    'Add','Clear','Close','Copy','Enter','Exit','Find','Format','Get','Hide','Join',
    'Lock','Move','New','Open','Optimize','Pop','Push','Redo','Remove','Rename',
    'Reset','Resize','Search','Select','Set','Show','Skip','Split','Step','Switch',
    'Undo','Unlock','Watch','Connect','Disconnect','Read','Receive','Send','Write',
    'Backup','Checkpoint','Compare','Compress','Convert','ConvertFrom','ConvertTo',
    'Dismount','Edit','Expand','Export','Group','Import','Initialize','Invoke',
    'Limit','Merge','Mount','Out','Publish','Restore','Save','Sort','Start','Stop',
    'Submit','Suspend','Sync','Unblock','Unpublish','Update','Use','Wait',
    'Approve','Assert','Complete','Confirm','Deny','Disable','Enable','Install',
    'Register','Request','Restart','Resume','Uninstall','Unregister','Test','Trace',
    'Debug','Measure','Ping','Repair','Resolve','Show','Tee','Trace'
)

$violations = @()

foreach ($dir in $SearchDirs) {
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem -Path $dir -Filter '*.ps1' -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $file = $_.FullName

        # Find all function declarations
        $funcMatches = [regex]::Matches($content, '(?m)^(?:function|filter)\s+([\w-]+)\s*(?:\{|$|\()')
        foreach ($m in $funcMatches) {
            $funcName = $m.Groups[1].Value

            # Skip anonymous/script-level
            if ($funcName -match '^\$') { continue }

            if ($funcName.StartsWith('_')) {
                # Private: must be _PascalCase (e.g., _MyHelper)
                if ($funcName -cnotmatch '^_[A-Z][a-zA-Z0-9]*$') {
                    $violations += "$file: private function '$funcName' does not follow _PascalCase convention"
                }
            } else {
                # Public: must be Verb-Noun
                if ($funcName -cnotmatch '^[A-Z][a-z]+-[A-Z]') {
                    $violations += "$file: public function '$funcName' does not follow Verb-Noun convention"
                } else {
                    $verb = ($funcName -split '-')[0]
                    if ($verb -notin $approvedVerbs) {
                        $violations += "$file: public function '$funcName' uses unapproved verb '$verb'"
                    }
                }
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Output "FAIL: Naming convention violations found:"
    $violations | ForEach-Object { Write-Output "  - $_" }
    if (-not $WhatIf) { exit 1 }
} else {
    Write-Output "PASS: All function names follow naming conventions."
    exit 0
}
