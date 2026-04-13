BeforeAll {
    $root = Resolve-Path "$PSScriptRoot/.."
    . "$root/utils/invoke-parallel.ps1"
}

Describe 'Invoke-Parallel' {
    It 'returns keyed results when both jobs succeed' {
        $jobs = @{
            alpha = @{ Script = { "hello from alpha" }; Args = @() }
            beta  = @{ Script = { "hello from beta" }; Args = @() }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results.Keys | Should -Contain 'alpha'
        $results.Keys | Should -Contain 'beta'
        $results['alpha'].Success | Should -BeTrue
        $results['alpha'].Output | Should -Be "hello from alpha"
        $results['alpha'].Error | Should -BeNullOrEmpty
        $results['beta'].Success | Should -BeTrue
        $results['beta'].Output | Should -Be "hello from beta"
    }

    It 'captures failure when one job throws' {
        $jobs = @{
            alpha = @{ Script = { throw "alpha exploded" }; Args = @() }
            beta  = @{ Script = { "beta is fine" }; Args = @() }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['alpha'].Success | Should -BeFalse
        $results['alpha'].Error | Should -Match 'alpha exploded'
        $results['alpha'].Output | Should -BeNullOrEmpty
        $results['beta'].Success | Should -BeTrue
        $results['beta'].Output | Should -Be "beta is fine"
    }

    It 'captures failure when both jobs throw' {
        $jobs = @{
            alpha = @{ Script = { throw "alpha broke" }; Args = @() }
            beta  = @{ Script = { throw "beta broke" }; Args = @() }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['alpha'].Success | Should -BeFalse
        $results['alpha'].Error | Should -Match 'alpha broke'
        $results['beta'].Success | Should -BeFalse
        $results['beta'].Error | Should -Match 'beta broke'
    }

    It 'keys results by caller-provided names' {
        $jobs = @{
            'my-custom-name' = @{ Script = { 42 }; Args = @() }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results.Keys | Should -Contain 'my-custom-name'
        $results['my-custom-name'].Success | Should -BeTrue
        $results['my-custom-name'].Output | Should -Be 42
    }

    It 'does not terminate passing job when sibling fails (failure isolation)' {
        $jobs = @{
            failing = @{ Script = { throw "fail fast" }; Args = @() }
            passing = @{ Script = { Start-Sleep -Milliseconds 200; "survived" }; Args = @() }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['failing'].Success | Should -BeFalse
        $results['passing'].Success | Should -BeTrue
        $results['passing'].Output | Should -Be "survived"
    }

    It 'provides scope isolation — job cannot access caller variables' {
        $outerVar = "secret"

        $jobs = @{
            isolated = @{
                Script = {
                    if ($outerVar) { return "leaked: $outerVar" }
                    return "isolated"
                }
                Args = @()
            }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['isolated'].Success | Should -BeTrue
        $results['isolated'].Output | Should -Be "isolated"
    }

    It 'passes ArgumentList values to job scriptblock as $args' {
        $jobs = @{
            withargs = @{
                Script = { return "got: $($args[0]) and $($args[1])" }
                Args = @("first", "second")
            }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['withargs'].Success | Should -BeTrue
        $results['withargs'].Output | Should -Be "got: first and second"
    }

    It 'handles jobs returning complex objects' {
        $jobs = @{
            complex = @{
                Script = { @{ Name = "test"; Count = 3 } }
                Args = @()
            }
        }

        $results = Invoke-Parallel -Jobs $jobs

        $results['complex'].Success | Should -BeTrue
        $results['complex'].Output.Name | Should -Be "test"
        $results['complex'].Output.Count | Should -Be 3
    }

}
