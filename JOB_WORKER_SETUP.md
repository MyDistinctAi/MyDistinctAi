# Job Queue Worker Setup

The job queue system requires a background worker to process pending jobs. This document explains how to set up the worker.

---

## 🎯 Overview

Jobs are enqueued when users upload files, but they need to be processed by a background worker. The worker calls the `/api/jobs/worker` endpoint which processes pending jobs from the queue.

---

## 🚀 Quick Start (Development)

### Option 1: Manual Testing
Call the worker endpoint manually to process jobs:

```bash
curl http://localhost:4000/api/jobs/worker
```

### Option 2: Simple Bash Script (Linux/Mac)
Create a file `run-worker.sh`:

```bash
#!/bin/bash
while true; do
  curl -s http://localhost:4000/api/jobs/worker
  sleep 60  # Run every 60 seconds
done
```

Make it executable and run:
```bash
chmod +x run-worker.sh
./run-worker.sh
```

### Option 3: PowerShell Script (Windows)
Create a file `run-worker.ps1`:

```powershell
while ($true) {
    Invoke-WebRequest -Uri "http://localhost:4000/api/jobs/worker" -Method GET
    Start-Sleep -Seconds 60
}
```

Run it:
```powershell
.\run-worker.ps1
```

---

## 🔒 Production Setup

### Option 1: Vercel Cron Jobs (Recommended for Vercel)

1. Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/jobs/worker",
      "schedule": "* * * * *"
    }
  ]
}
```

2. Add `WORKER_SECRET` to Vercel environment variables
3. Deploy to Vercel

### Option 2: External Cron Service

Use a service like:
- **cron-job.org** (free, easy setup)
- **EasyCron** (free tier available)
- **Cronitor** (monitoring included)

Setup:
1. Add `WORKER_SECRET` to your `.env.local`:
   ```
   WORKER_SECRET=your-secret-key-here
   ```

2. Configure the cron service to call:
   ```
   GET https://yourdomain.com/api/jobs/worker
   Authorization: Bearer your-secret-key-here
   ```

3. Set schedule: `*/1 * * * *` (every minute)

### Option 3: Server Cron Job

If you're self-hosting, add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every minute)
* * * * * curl -H "Authorization: Bearer your-secret-key" http://localhost:4000/api/jobs/worker
```

---

## 📊 Monitoring

### Check Worker Status

The worker endpoint returns:
```json
{
  "success": true,
  "processedCount": 5,
  "failedCount": 0,
  "message": "Processed 5 jobs, 0 failed"
}
```

### Check Job Queue Status

Query the database:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM job_queue
GROUP BY status;
```

Or use the Supabase MCP:
```javascript
await mcp3_execute_sql({
  project_id: "your-project-id",
  query: "SELECT status, COUNT(*) FROM job_queue GROUP BY status"
})
```

---

## 🔧 Configuration

### Environment Variables

```env
# Optional: Secret key for worker authentication
WORKER_SECRET=your-secret-key-here
```

### Worker Settings

Edit `/src/app/api/jobs/worker/route.ts`:

```typescript
const maxJobs = 10 // Process up to 10 jobs per run
```

Adjust based on your needs:
- **High volume**: Increase to 50-100
- **Low volume**: Keep at 10
- **Resource constrained**: Decrease to 5

---

## 🐛 Troubleshooting

### Jobs Not Processing

1. **Check if worker is running**:
   ```bash
   curl http://localhost:4000/api/jobs/worker
   ```

2. **Check job queue**:
   ```sql
   SELECT * FROM job_queue WHERE status = 'pending' LIMIT 5;
   ```

3. **Check server logs** for errors

### Worker Returns 401 Unauthorized

- Make sure `WORKER_SECRET` matches in both `.env.local` and your cron configuration
- Or remove the secret check for development (not recommended for production)

### Jobs Stuck in "processing"

Jobs might get stuck if the worker crashes. Reset them:

```sql
UPDATE job_queue 
SET status = 'pending', started_at = NULL 
WHERE status = 'processing' 
  AND started_at < NOW() - INTERVAL '10 minutes';
```

---

## 📈 Performance Tips

1. **Adjust frequency**: 
   - High volume: Run every 30 seconds
   - Low volume: Run every 5 minutes

2. **Batch processing**:
   - Increase `maxJobs` for better throughput
   - Decrease for lower resource usage

3. **Monitoring**:
   - Set up alerts for failed jobs
   - Monitor queue depth
   - Track processing time

---

## 🎯 Next Steps

1. Set up a cron job for your environment
2. Test with a file upload
3. Monitor the job queue
4. Adjust worker frequency as needed

---

## 📝 Example: Testing the Full Flow

1. **Upload a file** via the dashboard
2. **Check job was enqueued**:
   ```sql
   SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 1;
   ```

3. **Run the worker**:
   ```bash
   curl http://localhost:4000/api/jobs/worker
   ```

4. **Verify job was processed**:
   ```sql
   SELECT * FROM job_queue WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1;
   ```

5. **Check training_data status**:
   ```sql
   SELECT status FROM training_data ORDER BY created_at DESC LIMIT 1;
   ```

Expected flow:
- File upload → job_queue (status: pending)
- Worker runs → job_queue (status: processing)
- Processing complete → job_queue (status: completed)
- Training data updated → training_data (status: processed)
