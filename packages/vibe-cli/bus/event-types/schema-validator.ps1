function Test-BusEventPayload {
    <#
    .SYNOPSIS
        Validates a JSON payload against the JSON schema for the given event type.
    .OUTPUTS
        Hashtable with IsValid ($true/$false) and Errors (array of strings).
    #>
    param(
        [Parameter(Mandatory)][string]$EventType,
        [Parameter(Mandatory)][string]$PayloadJson
    )

    $errors = [System.Collections.Generic.List[string]]::new()

    # Resolve schema path relative to this script
    $schemaDir  = $PSScriptRoot
    $schemaPath = Join-Path $schemaDir "$EventType.schema.json"

    if (-not (Test-Path $schemaPath)) {
        $errors.Add("Unknown event type '$EventType': schema file not found at '$schemaPath'")
        return @{ IsValid = $false; Errors = $errors.ToArray() }
    }

    # Parse schema
    try {
        $schema = Get-Content $schemaPath -Raw | ConvertFrom-Json
    } catch {
        $errors.Add("Failed to parse schema for '$EventType': $_")
        return @{ IsValid = $false; Errors = $errors.ToArray() }
    }

    # Parse payload
    try {
        $payload = $PayloadJson | ConvertFrom-Json
    } catch {
        $errors.Add("Invalid JSON payload: $_")
        return @{ IsValid = $false; Errors = $errors.ToArray() }
    }

    # Convert payload to hashtable for easier key checking
    $payloadHash = @{}
    $payload.PSObject.Properties | ForEach-Object { $payloadHash[$_.Name] = $_.Value }

    # Validate required fields
    if ($schema.required) {
        foreach ($req in $schema.required) {
            if (-not $payloadHash.ContainsKey($req)) {
                $errors.Add("Missing required field: '$req'")
            }
        }
    }

    # Validate property types, maxLength, and enum if properties defined
    if ($schema.properties) {
        foreach ($propDef in $schema.properties.PSObject.Properties) {
            $propName  = $propDef.Name
            $propSchema = $propDef.Value

            if (-not $payloadHash.ContainsKey($propName)) {
                continue  # optional field absent — fine
            }

            $value = $payloadHash[$propName]

            # Type check
            if ($propSchema.type) {
                $typeOk = _Test-SchemaType -Value $value -TypeSpec $propSchema.type
                if (-not $typeOk) {
                    $errors.Add("Field '$propName': expected type '$($propSchema.type)', got '$($value.GetType().Name)'")
                }
            }

            # maxLength check (strings only)
            if ($null -ne $propSchema.maxLength -and $value -is [string]) {
                if ($value.Length -gt $propSchema.maxLength) {
                    $errors.Add("Field '$propName': length $($value.Length) exceeds maxLength $($propSchema.maxLength)")
                }
            }

            # enum check
            if ($propSchema.enum) {
                $enumList = @($propSchema.enum)
                if ($value -notin $enumList) {
                    $errors.Add("Field '$propName': value '$value' is not in enum [$($enumList -join ', ')]")
                }
            }

            # Array items type check
            if ($propSchema.type -eq 'array' -and $propSchema.items -and $propSchema.items.type -and $value -is [System.Array]) {
                $itemType = $propSchema.items.type
                $idx = 0
                foreach ($item in $value) {
                    if (-not (_Test-SchemaType -Value $item -TypeSpec $itemType)) {
                        $errors.Add("Field '$propName[$idx]': expected item type '$itemType'")
                    }
                    $idx++
                }
            }
        }
    }

    return @{
        IsValid = ($errors.Count -eq 0)
        Errors  = $errors.ToArray()
    }
}

function _Test-SchemaType {
    param(
        $Value,
        $TypeSpec  # string or array of strings (JSON Schema allows both)
    )

    # Normalize to array
    if ($TypeSpec -is [string]) {
        $types = @($TypeSpec)
    } else {
        $types = @($TypeSpec)
    }

    foreach ($t in $types) {
        switch ($t) {
            'string'  { if ($Value -is [string])                        { return $true } }
            'integer' { if ($Value -is [int] -or $Value -is [long] -or
                             $Value -is [int64] -or ($Value -is [double] -and $Value -eq [Math]::Floor($Value))) { return $true } }
            'boolean' { if ($Value -is [bool])                          { return $true } }
            'array'   { if ($Value -is [System.Array] -or
                             $Value -is [System.Collections.IList])     { return $true } }
            'object'  { if ($Value -is [PSCustomObject] -or
                             $Value -is [hashtable])                    { return $true } }
            'null'    { if ($null -eq $Value)                           { return $true } }
        }
    }
    return $false
}
