$script:GitLockPatterns = @(
    'The process cannot access the file'
    'Permission denied'
    'unable to unlink'
    'cannot lock ref'
)

function Invoke-GitWithRetry {
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [int]$MaxRetries = 3,
        [string]$WorkingDirectory
    )

    $backoffSeconds = @(1, 2, 4)

    for ($attempt = 0; $attempt -le $MaxRetries; $attempt++) {
        $errOutput = $null

        try {
            $params = @{ FilePath = 'git'; ArgumentList = $Arguments; Wait = $true; NoNewWindow = $true }

            if ($WorkingDirectory) {
                $originalDir = Get-Location
                Set-Location $WorkingDirectory
            }

            try {
                $output = & git @Arguments 2>&1
                $exitCode = $LASTEXITCODE

                if ($exitCode -eq 0) {
                    return $output
                }

                $errOutput = ($output | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] } |
                    ForEach-Object { $_.ToString() }) -join "`n"
                if (-not $errOutput) { $errOutput = $output -join "`n" }
            }
            finally {
                if ($WorkingDirectory -and $originalDir) {
                    Set-Location $originalDir
                }
            }
        }
        catch {
            $errOutput = $_.Exception.Message
        }

        # Check if error is a retryable file-lock issue
        $isLockError = $false
        foreach ($pattern in $script:GitLockPatterns) {
            if ($errOutput -match [regex]::Escape($pattern)) {
                $isLockError = $true
                break
            }
        }

        if (-not $isLockError) {
            throw "Git command failed: git $($Arguments -join ' ')`n$errOutput"
        }

        if ($attempt -lt $MaxRetries) {
            $delay = $backoffSeconds[$attempt]
            Write-PipelineLog "Git file-lock error (attempt $($attempt + 1)/$MaxRetries), retrying in ${delay}s..."
            Start-Sleep -Seconds $delay
        }
    }

    throw "Git command failed after $MaxRetries retries (file lock): git $($Arguments -join ' ')`n$errOutput"
}
