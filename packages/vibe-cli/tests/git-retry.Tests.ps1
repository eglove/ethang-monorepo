BeforeAll {
    . "$PSScriptRoot/../utils/config.ps1"
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
