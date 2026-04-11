# =============================================================================
# contract-engine.ps1 — PowerShell-native consumer-driven contract testing
# No third-party dependencies. Validates data shapes against contract schemas.
# =============================================================================

$ErrorActionPreference = 'Stop'

function New-FieldSpec {
    <#
    .SYNOPSIS
        Defines a single field's contract: name, type, allowed values, required.
    .PARAMETER Type
        Expected PowerShell type: 'string', 'int', 'bool', 'hashtable', 'array',
        'object' (PSCustomObject), 'null-or-string', 'null-or-int'.
    .PARAMETER AllowedValues
        If non-empty, the field's value must be in this set.
    #>
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Type,
        [array]$AllowedValues = @(),
        [bool]$Required = $true,
        $DefaultValue = $null
    )
    return @{
        Name          = $Name
        Type          = $Type
        AllowedValues = $AllowedValues
        Required      = $Required
        DefaultValue  = $DefaultValue
    }
}

function New-ContractSchema {
    <#
    .SYNOPSIS
        Defines a contract between a consumer and provider.
    .PARAMETER Fields
        Array of field specs (from New-FieldSpec).
    .PARAMETER CrossFieldRules
        Array of scriptblocks. Each takes ($Data) and returns @{ Valid=$bool; Message=$string }.
    #>
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Consumer,
        [Parameter(Mandatory)][string]$Provider,
        [Parameter(Mandatory)][array]$Fields,
        [scriptblock[]]$CrossFieldRules = @()
    )
    return @{
        Name            = $Name
        Consumer        = $Consumer
        Provider        = $Provider
        Fields          = $Fields
        CrossFieldRules = $CrossFieldRules
    }
}

function Test-FieldType {
    <#
    .SYNOPSIS
        Validates a value against an expected type string.
    #>
    param(
        $Value,
        [string]$ExpectedType
    )

    switch ($ExpectedType) {
        'string'          { return $Value -is [string] }
        'int'             { return $Value -is [int] -or $Value -is [long] }
        'bool'            { return $Value -is [bool] }
        'hashtable'       { return $Value -is [hashtable] }
        'array'           {
            # PowerShell aggressively unwraps arrays: @() -> $null, @($x) -> $x
            # Accept null (empty array), actual arrays, IList, and scalars (single-element unwrap)
            return $null -eq $Value -or $Value -is [array] -or $Value -is [System.Collections.IList] -or $Value -is [PSCustomObject] -or $Value -is [hashtable] -or $Value -is [string]
        }
        'object'          { return $Value -is [PSCustomObject] -or $Value -is [hashtable] }
        'null-or-string'  { return $null -eq $Value -or $Value -is [string] }
        'null-or-int'     { return $null -eq $Value -or $Value -is [int] -or $Value -is [long] }
        'null-or-hashtable' { return $null -eq $Value -or $Value -is [hashtable] }
        'null-or-array'   { return $null -eq $Value -or $Value -is [array] -or $Value -is [System.Collections.IList] }
        'any'             { return $true }
        default           { return $false }
    }
}

function Test-Contract {
    <#
    .SYNOPSIS
        Validates data against a contract schema.
    .OUTPUTS
        Hashtable with Valid (bool) and Violations (string array).
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Schema,
        [Parameter(Mandatory)]$Data
    )

    $violations = [System.Collections.ArrayList]::new()

    # Handle both hashtable and PSCustomObject
    $isHashtable = $Data -is [hashtable]
    $isPSCustomObject = $Data -is [PSCustomObject]

    if (-not $isHashtable -and -not $isPSCustomObject) {
        $null = $violations.Add("Data must be a hashtable or PSCustomObject, got $($Data.GetType().Name)")
        return @{ Valid = $false; Violations = $violations.ToArray() }
    }

    foreach ($field in $Schema.Fields) {
        $fieldName = $field.Name

        # Check field existence
        $hasField = if ($isHashtable) {
            $Data.ContainsKey($fieldName)
        } else {
            $null -ne $Data.PSObject.Properties[$fieldName]
        }

        $value = if ($hasField) {
            if ($isHashtable) { $Data[$fieldName] } else { $Data.$fieldName }
        } else { $null }

        if (-not $hasField) {
            if ($field.Required) {
                $null = $violations.Add("Missing required field '$fieldName'")
            }
            continue
        }

        # Check type (skip for null-allowed types when value is null)
        if (-not (Test-FieldType -Value $value -ExpectedType $field.Type)) {
            $actualType = if ($null -eq $value) { 'null' } else { $value.GetType().Name }
            $null = $violations.Add("Field '$fieldName' expected type '$($field.Type)', got '$actualType'")
        }

        # Check allowed values
        if ($field.AllowedValues.Count -gt 0 -and $null -ne $value) {
            if ($value -notin $field.AllowedValues) {
                $null = $violations.Add("Field '$fieldName' value '$value' not in allowed set: [$($field.AllowedValues -join ', ')]")
            }
        }
    }

    # Run cross-field rules
    foreach ($rule in $Schema.CrossFieldRules) {
        $ruleResult = & $rule $Data
        if (-not $ruleResult.Valid) {
            $null = $violations.Add($ruleResult.Message)
        }
    }

    return @{
        Valid      = ($violations.Count -eq 0)
        Violations = $violations.ToArray()
    }
}

function Format-ContractViolations {
    <#
    .SYNOPSIS
        Formats contract violations for Pester diagnostic output.
    #>
    param(
        [Parameter(Mandatory)][hashtable]$Result,
        [string]$ContractName = ''
    )

    if ($Result.Valid) { return 'Contract satisfied' }

    $header = if ($ContractName) { "CONTRACT VIOLATION ($ContractName)" } else { 'CONTRACT VIOLATION' }
    $lines = @($header)
    foreach ($v in $Result.Violations) {
        $lines += "  - $v"
    }
    return ($lines -join "`n")
}
