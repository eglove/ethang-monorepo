BeforeAll {
    . "$PSScriptRoot/helpers/test-config.ps1"
    . "$PSScriptRoot/../utils/git-retry.ps1"
}

Describe 'Invoke-GitWithRetry' {
    BeforeAll {
        Mock Write-PipelineLog {}
        Mock Write-Host {}
        Mock Start-Sleep {}
    }

    It 'returns output on successful first attempt' {
        Mock git { 'success output'; $global:LASTEXITCODE = 0 }
        $result = Invoke-GitWithRetry -Arguments @('status')
        $result | Should -Match 'success'
    }

    It 'retries on file-lock error and succeeds on second attempt' {
        $script:attempt = 0
        Mock git {
            $script:attempt++
            if ($script:attempt -eq 1) {
                $errRecord = [System.Management.Automation.ErrorRecord]::new(
                    [Exception]::new('The process cannot access the file'),
                    'GitLock', 'NotSpecified', $null
                )
                $errRecord
                $global:LASTEXITCODE = 128
            }
            else {
                'success'
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-GitWithRetry -Arguments @('checkout', '--', '.')
        $result | Should -Contain 'success'
        Should -Invoke Start-Sleep -Times 1
    }

    It 'does not retry non-lock errors' {
        Mock git {
            $errRecord = [System.Management.Automation.ErrorRecord]::new(
                [Exception]::new('merge conflict in file.txt'),
                'GitMerge', 'NotSpecified', $null
            )
            $errRecord
            $global:LASTEXITCODE = 1
        }

        { Invoke-GitWithRetry -Arguments @('merge', 'branch') } | Should -Throw '*merge conflict*'
        Should -Not -Invoke Start-Sleep
    }

    It 'throws after exhausting retries on persistent lock' {
        Mock git {
            $errRecord = [System.Management.Automation.ErrorRecord]::new(
                [Exception]::new('unable to unlink old file'),
                'GitLock', 'NotSpecified', $null
            )
            $errRecord
            $global:LASTEXITCODE = 128
        }

        { Invoke-GitWithRetry -Arguments @('checkout', 'main') -MaxRetries 3 } | Should -Throw '*retries*'
    }

    It 'retries on Permission denied error' {
        $script:attempt2 = 0
        Mock git {
            $script:attempt2++
            if ($script:attempt2 -le 1) {
                $errRecord = [System.Management.Automation.ErrorRecord]::new(
                    [Exception]::new('Permission denied'),
                    'GitPerm', 'NotSpecified', $null
                )
                $errRecord
                $global:LASTEXITCODE = 128
            }
            else {
                'ok'
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-GitWithRetry -Arguments @('pull')
        $result | Should -Contain 'ok'
    }

    It 'changes directory when WorkingDirectory is provided' {
        Mock git { 'wd-success'; $global:LASTEXITCODE = 0 }
        Mock Set-Location {}
        Mock Get-Location { return 'C:\original' }

        $result = Invoke-GitWithRetry -Arguments @('status') -WorkingDirectory 'C:\repo'
        $result | Should -Match 'wd-success'
        Should -Invoke Set-Location -Times 2
    }

    It 'restores directory on failure when WorkingDirectory is provided' {
        Mock git {
            $errRecord = [System.Management.Automation.ErrorRecord]::new(
                [Exception]::new('fatal: not a git repository'),
                'GitError', 'NotSpecified', $null
            )
            $errRecord
            $global:LASTEXITCODE = 128
        }
        Mock Set-Location {}
        Mock Get-Location { return 'C:\original' }

        { Invoke-GitWithRetry -Arguments @('status') -WorkingDirectory 'C:\repo' } | Should -Throw '*not a git repository*'
        # Should restore original directory despite the error
        Should -Invoke Set-Location -ParameterFilter { $Path -eq 'C:\original' }
    }

    It 'handles exception thrown by git command itself' {
        # Covers lines 46-48 (catch block)
        Mock git { throw "Command not found" }
        { Invoke-GitWithRetry -Arguments @('status') -MaxRetries 0 } | Should -Throw '*Command not found*'
    }

    It 'falls back to joining output when no ErrorRecord objects found' {
        # Covers line 38 (if (-not $errOutput) { $errOutput = $output -join "`n" })
        Mock git {
            'error: some plain text error'
            $global:LASTEXITCODE = 1
        }
        { Invoke-GitWithRetry -Arguments @('merge', 'branch') } | Should -Throw '*some plain text error*'
    }

    It 'retries on cannot lock ref error' {
        $script:attempt3 = 0
        Mock git {
            $script:attempt3++
            if ($script:attempt3 -le 1) {
                $errRecord = [System.Management.Automation.ErrorRecord]::new(
                    [Exception]::new('cannot lock ref'),
                    'GitRef', 'NotSpecified', $null
                )
                $errRecord
                $global:LASTEXITCODE = 128
            }
            else {
                'done'
                $global:LASTEXITCODE = 0
            }
        }

        $result = Invoke-GitWithRetry -Arguments @('fetch')
        $result | Should -Contain 'done'
    }
}
