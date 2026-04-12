function Complete-Pipeline {
    <#
    .SYNOPSIS
        Writes terminal marker (PIPELINE COMPLETE or PIPELINE HALTED), logs lock release, and returns status.
    .OUTPUTS
        Hashtable: @{ Status = $Status; Timestamp = [datetime] }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][ValidateSet('complete', 'halted')][string]$Status
    )

    if ($Status -eq 'complete') {
        Write-PipelineLog -Message ">>> PIPELINE COMPLETE" -Root $Root
    }
    else {
        Write-PipelineLog -Message ">>> PIPELINE HALTED" -Root $Root
    }

    Write-PipelineLog -Message "Lock released — pipeline $Status" -Root $Root

    return @{
        Status    = $Status
        Timestamp = Get-Date
    }
}
