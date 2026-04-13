function Register-Artifact {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FeatureName,
        [Parameter(Mandatory)]
        [int]$Stage,
        [Parameter(Mandatory)]
        [string]$ArtifactType,
        [Parameter(Mandatory)]
        [string]$FilePath
    )

    Assert-StateDatabaseOpen

    Invoke-SqliteQuery -DataSource $script:StateDbPath -Query "INSERT INTO artifacts (feature_name, stage, artifact_type, file_path) VALUES (@f, @s, @t, @p)" -SqlParameters @{ f = $FeatureName; s = $Stage; t = $ArtifactType; p = $FilePath }
}
