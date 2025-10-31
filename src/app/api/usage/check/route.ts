/**
 * API Route: /api/usage/check
 * Check user's token usage and return nudge if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getUserUsage, shouldSendNudge, updateNudgeSent } from '@/lib/usage-tracking'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(cookies())

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get usage statistics
    const usage = await getUserUsage(user.id)

    if (!usage) {
      return NextResponse.json(
        { error: 'Failed to get usage statistics' },
        { status: 500 }
      )
    }

    // Check if user needs a nudge
    const nudge = shouldSendNudge(usage)

    // If nudge is needed and hasn't been sent yet, record it
    if (nudge) {
      await updateNudgeSent(user.id, nudge.threshold)
    }

    return NextResponse.json({
      usage,
      nudge,
    })
  } catch (error) {
    console.error('Error checking usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
