function Invoke-LongPathCheck {
    param(
        [Parameter(Mandatory)][string]$Path
    )

    # Normalize path first
    $normalized = [System.IO.Path]::GetFullPath($Path)

    if ($normalized.Length -le 240) {
        return $normalized
    }

    # Path > 240 chars: apply SHA-256 segment truncation fallback
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalized)
    $hash = $sha256.ComputeHash($bytes)
    $sha256.Dispose()
    $hashHex = ($hash | ForEach-Object { $_.ToString('x2') }) -join ''
    $truncatedHash = $hashHex.Substring(0, 40)

    # Use the drive root + hash-based segment as the shortened path
    $root = [System.IO.Path]::GetPathRoot($normalized)
    $ext = [System.IO.Path]::GetExtension($normalized)
    $shortened = Join-Path $root "bus-$truncatedHash$ext"

    return $shortened
}
