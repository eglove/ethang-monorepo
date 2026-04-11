function ConvertFrom-AgentResponse {
    param([string]$Response)

    if (-not $Response) { return $null }

    # Try direct JSON parse first (pure JSON response)
    try { return $Response | ConvertFrom-Json -ErrorAction Stop } catch { }

    # Extract last ```json ... ``` block from markdown-wrapped response
    if ($Response -match '(?s)```json\s*\r?\n(.+?)\r?\n\s*```') {
        try { return $Matches[1] | ConvertFrom-Json -ErrorAction Stop } catch { }
    }

    return $null
}
