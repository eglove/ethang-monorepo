function ConvertFrom-Gherkin {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path -Encoding UTF8
    $features = [System.Collections.ArrayList]::new()

    $currentFeature = $null
    $currentScenario = $null
    $currentBackground = $null
    $currentRule = $null
    $currentStep = $null
    $pendingTags = [System.Collections.ArrayList]::new()
    $inDocString = $false
    $docStringLines = [System.Collections.ArrayList]::new()
    $inExamplesTable = $false
    $examplesHeaders = @()
    $examplesRows = [System.Collections.ArrayList]::new()
    $inDataTable = $false
    $dataTableHeaders = @()
    $dataTableRows = [System.Collections.ArrayList]::new()
    $scenarioTarget = $null

    foreach ($rawLine in $lines) {
        $line = $rawLine

        # Handle doc strings
        if ($inDocString) {
            if ($line.Trim() -eq '```') {
                $inDocString = $false
                if ($null -ne $currentStep) {
                    $currentStep.docString = $docStringLines -join "`n"
                }
                $docStringLines = [System.Collections.ArrayList]::new()
            } else {
                [void]$docStringLines.Add($line.TrimStart())
            }
            continue
        }

        $trimmed = $line.Trim()

        # Skip empty lines and comments
        if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) {
            continue
        }

        # Doc string start
        if ($trimmed -eq '```') {
            $inDocString = $true
            $docStringLines = [System.Collections.ArrayList]::new()
            continue
        }

        # Tags
        if ($trimmed -match '^@') {
            $tags = $trimmed -split '\s+' | Where-Object { $_ -match '^@' }
            foreach ($t in $tags) { [void]$pendingTags.Add($t) }
            continue
        }

        # Table row (data table or examples)
        if ($trimmed.StartsWith('|')) {
            $cells = @($trimmed.Trim().TrimStart('|').TrimEnd('|') -split '\|' | ForEach-Object { $_.Trim() })

            if ($inExamplesTable) {
                if ($examplesHeaders.Count -eq 0) {
                    $examplesHeaders = $cells
                } else {
                    [void]$examplesRows.Add($cells)
                }
            } elseif ($inDataTable) {
                if ($dataTableHeaders.Count -eq 0) {
                    $dataTableHeaders = $cells
                } else {
                    [void]$dataTableRows.Add($cells)
                }
            } else {
                # First table row after a step - start data table
                $inDataTable = $true
                $dataTableHeaders = $cells
                $dataTableRows = [System.Collections.ArrayList]::new()
            }
            continue
        }

        # Flush data table if we were collecting one
        if ($inDataTable) {
            if ($null -ne $currentStep -and $dataTableRows.Count -gt 0) {
                $rows = [System.Collections.ArrayList]::new()
                foreach ($row in $dataTableRows) {
                    $ht = @{}
                    for ($i = 0; $i -lt $dataTableHeaders.Count; $i++) {
                        $ht[$dataTableHeaders[$i]] = if ($i -lt $row.Count) { $row[$i] } else { '' }
                    }
                    [void]$rows.Add($ht)
                }
                $currentStep.dataTable = @($rows.ToArray())
            }
            $inDataTable = $false
            $dataTableHeaders = @()
            $dataTableRows = [System.Collections.ArrayList]::new()
        }

        # Flush examples table if we were collecting one
        if ($inExamplesTable) {
            if ($null -ne $currentScenario) {
                if ($examplesRows.Count -eq 0) {
                    Write-Warning "Scenario Outline '$($currentScenario.name)' has Examples with headers but no data rows."
                }
                foreach ($row in $examplesRows) {
                    $ht = @{}
                    for ($i = 0; $i -lt $examplesHeaders.Count; $i++) {
                        $ht[$examplesHeaders[$i]] = if ($i -lt $row.Count) { $row[$i] } else { '' }
                    }
                    [void]$currentScenario.examples.Add($ht)
                }
            }
            $inExamplesTable = $false
            $examplesHeaders = @()
            $examplesRows = [System.Collections.ArrayList]::new()
        }

        # Feature
        if ($trimmed -match '^Feature:\s*(.*)') {
            $currentFeature = @{
                name       = $Matches[1].Trim()
                tags       = @($pendingTags.ToArray())
                scenarios  = [System.Collections.ArrayList]::new()
                background = $null
                rules      = [System.Collections.ArrayList]::new()
            }
            $scenarioTarget = $currentFeature.scenarios
            [void]$features.Add($currentFeature)
            $pendingTags = [System.Collections.ArrayList]::new()
            $currentScenario = $null
            $currentBackground = $null
            $currentRule = $null
            $currentStep = $null
            continue
        }

        # Background
        if ($trimmed -match '^Background:') {
            $currentBackground = @{
                steps = [System.Collections.ArrayList]::new()
            }
            if ($null -ne $currentFeature) {
                $currentFeature.background = $currentBackground
            }
            $currentScenario = $null
            $currentStep = $null
            continue
        }

        # Rule
        if ($trimmed -match '^Rule:\s*(.*)') {
            $currentRule = @{
                name      = $Matches[1].Trim()
                scenarios = [System.Collections.ArrayList]::new()
            }
            if ($null -ne $currentFeature) {
                [void]$currentFeature.rules.Add($currentRule)
            }
            $scenarioTarget = $currentRule.scenarios
            $currentScenario = $null
            $currentStep = $null
            continue
        }

        # Examples
        if ($trimmed -match '^Examples:') {
            $inExamplesTable = $true
            $examplesHeaders = @()
            $examplesRows = [System.Collections.ArrayList]::new()
            continue
        }

        # Scenario / Scenario Outline
        if ($trimmed -match '^(Scenario Outline|Scenario):\s*(.*)') {
            $currentScenario = @{
                name     = $Matches[2].Trim()
                keyword  = $Matches[1]
                tags     = @($pendingTags.ToArray())
                steps    = [System.Collections.ArrayList]::new()
                examples = [System.Collections.ArrayList]::new()
            }
            $pendingTags = [System.Collections.ArrayList]::new()
            if ($null -ne $scenarioTarget) {
                [void]$scenarioTarget.Add($currentScenario)
            }
            $currentBackground = $null
            $currentStep = $null
            continue
        }

        # Steps: Given/When/Then/And/But
        if ($trimmed -match '^(Given|When|Then|And|But)\s+(.*)') {
            $step = @{
                keyword   = $Matches[1]
                text      = $Matches[2].Trim()
                dataTable = $null
                docString = $null
            }
            $currentStep = $step

            if ($null -ne $currentBackground) {
                [void]$currentBackground.steps.Add($step)
            } elseif ($null -ne $currentScenario) {
                [void]$currentScenario.steps.Add($step)
            }
            continue
        }
    }

    # Flush any remaining data table
    if ($inDataTable) {
        if ($null -ne $currentStep -and $dataTableRows.Count -gt 0) {
            $rows = [System.Collections.ArrayList]::new()
            foreach ($row in $dataTableRows) {
                $ht = @{}
                for ($i = 0; $i -lt $dataTableHeaders.Count; $i++) {
                    $ht[$dataTableHeaders[$i]] = if ($i -lt $row.Count) { $row[$i] } else { '' }
                }
                [void]$rows.Add($ht)
            }
            $currentStep.dataTable = @($rows.ToArray())
        }
    }

    # Flush any remaining examples table
    if ($inExamplesTable) {
        if ($null -ne $currentScenario) {
            if ($examplesRows.Count -eq 0) {
                Write-Warning "Scenario Outline '$($currentScenario.name)' has Examples with headers but no data rows."
            }
            foreach ($row in $examplesRows) {
                $ht = @{}
                for ($i = 0; $i -lt $examplesHeaders.Count; $i++) {
                    $ht[$examplesHeaders[$i]] = if ($i -lt $row.Count) { $row[$i] } else { '' }
                }
                [void]$currentScenario.examples.Add($ht)
            }
        }
    }

    return @{
        features = @($features.ToArray())
    }
}

function Export-BddFixture {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [hashtable]$Fixture,

        [Parameter(Mandatory)]
        [string]$OutputPath
    )

    # Ensure schemaVersion is present
    if (-not $Fixture.ContainsKey('schemaVersion')) {
        $Fixture['schemaVersion'] = 1
    }

    # Create directory if missing
    $dir = Split-Path -Path $OutputPath -Parent
    if (-not [string]::IsNullOrEmpty($dir) -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $json = $Fixture | ConvertTo-Json -Depth 20 -Compress:$false

    # Atomic write with retries
    $maxRetries = 3
    $retryDelay = 2

    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        try {
            $tempPath = "$OutputPath.$([System.IO.Path]::GetRandomFileName()).tmp"
            Set-Content -Path $tempPath -Value $json -Encoding UTF8 -Force
            Move-Item -Path $tempPath -Destination $OutputPath -Force

            # fsync
            $fs = [System.IO.File]::Open($OutputPath, 'Open', 'Read', 'Read')
            $fs.Flush($true)
            $fs.Close()

            return
        } catch {
            if ($attempt -eq $maxRetries) {
                throw
            }
            Start-Sleep -Seconds $retryDelay
        }
    }
}
