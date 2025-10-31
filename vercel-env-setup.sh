#!/bin/bash
# Vercel Environment Variables Setup Script
# Run this to set up all required environment variables for Vercel

echo "🚀 Setting up Vercel environment variables..."
echo ""

# Required variables
echo "Setting required variables..."
vercel env add NEXT_PUBLIC_APP_URL production << EOF
https://your-project.vercel.app
EOF

vercel env add NEXT_PUBLIC_SUPABASE_URL production << EOF
https://ekfdbotohslpalnyvdpk.supabase.co
EOF

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjIyMTEsImV4cCI6MjA3NjUzODIxMX0.me4ZQupg0WNTf8K6r-B8AsnkXvetSXn0Um390y1UZ1w
EOF

vercel env add SUPABASE_SERVICE_ROLE_KEY production << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmRib3RvaHNscGFsbnl2ZHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2MjIxMSwiZXhwIjoyMDc2NTM4MjExfQ.EAqXIjfGI7YZNpxzT-hZRuMidRHjWlC1HVN8beo8rm8
EOF

echo ""
echo "✅ Environment variables set up successfully!"
echo ""
echo "Next steps:"
echo "1. Update NEXT_PUBLIC_APP_URL with your actual Vercel URL after deployment"
echo "2. Run: vercel --prod"
echo "3. Visit your live site!"
