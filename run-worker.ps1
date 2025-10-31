# Job Queue Worker - PowerShell Script
# Runs the background worker every 60 seconds to process pending jobs

Write-Host "🚀 Starting Job Queue Worker..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$workerUrl = "http://localhost:4000/api/jobs/worker"
$interval = 60 # seconds

while ($true) {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Calling worker endpoint..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri $workerUrl -Method GET -ErrorAction Stop
        
        if ($response.success) {
            $processed = $response.processedCount
            $failed = $response.failedCount
            
            if ($processed -gt 0 -or $failed -gt 0) {
                Write-Host "  ✅ Processed: $processed jobs" -ForegroundColor Green
                if ($failed -gt 0) {
                    Write-Host "  ❌ Failed: $failed jobs" -ForegroundColor Red
                }
            } else {
                Write-Host "  ℹ️  No jobs in queue" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ⚠️  Worker returned error" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ❌ Error calling worker: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "  ⏱️  Waiting $interval seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds $interval
}
