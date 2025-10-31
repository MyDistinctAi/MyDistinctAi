/**
 * Usage Tracking Service
 * Handles token usage monitoring, logging, and nudge notifications
 */

import { createClient } from '@/lib/supabase/server'

export interface UsageStats {
  tokensUsed: number
  monthlyCap: number
  usagePercentage: number
  lastNudgeSent: number
  planName: string
}

export interface NudgeLevel {
  threshold: number
  title: string
  message: string
  urgency: 'info' | 'warning' | 'error'
  showAnimation: boolean
}

/**
 * Nudge configuration based on usage percentage
 */
export const NUDGE_LEVELS: Record<number, NudgeLevel> = {
  50: {
    threshold: 50,
    title: "Halfway there!",
    message: "You've used 50% of your monthly tokens. Looks like you're really putting your AI to work 🚀. Upgrade anytime to unlock more.",
    urgency: 'info',
    showAnimation: false,
  },
  80: {
    threshold: 80,
    title: "Heads up",
    message: "You've reached 80% of your monthly tokens. Upgrade now so your AI keeps running at full speed without interruptions.",
    urgency: 'warning',
    showAnimation: false,
  },
  90: {
    threshold: 90,
    title: "Almost at your limit",
    message: "You're almost at your monthly limit — only 10% tokens left. Upgrade now to keep your AI flowing without slowdown or reset.",
    urgency: 'error',
    showAnimation: true,
  },
}

/**
 * Log token usage for a user
 */
export async function logTokenUsage(params: {
  userId: string
  tokens: number
  modelId?: string
  sessionId?: string
  requestType?: string
  modelName?: string
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('log_token_usage', {
    p_user_id: params.userId,
    p_tokens: params.tokens,
    p_model_id: params.modelId || null,
    p_session_id: params.sessionId || null,
    p_request_type: params.requestType || 'chat',
    p_model_name: params.modelName || null,
  })

  if (error) {
    console.error('Error logging token usage:', error)
    throw new Error(`Failed to log token usage: ${error.message}`)
  }
}

/**
 * Get user's current usage statistics
 */
export async function getUserUsage(userId: string): Promise<UsageStats | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_user_usage', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error getting user usage:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  const usage = data[0]
  return {
    tokensUsed: Number(usage.tokens_used),
    monthlyCap: Number(usage.monthly_cap),
    usagePercentage: Number(usage.usage_percentage),
    lastNudgeSent: Number(usage.last_nudge_sent),
    planName: usage.plan_name,
  }
}

/**
 * Check if user needs a nudge and return the appropriate level
 */
export function shouldSendNudge(usage: UsageStats): NudgeLevel | null {
  const { usagePercentage, lastNudgeSent } = usage

  // Check each threshold from highest to lowest
  for (const threshold of [90, 80, 50]) {
    if (usagePercentage >= threshold && lastNudgeSent < threshold) {
      return NUDGE_LEVELS[threshold]
    }
  }

  return null
}

/**
 * Record that a nudge was sent to the user
 */
export async function updateNudgeSent(
  userId: string,
  nudgeLevel: number
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_nudge_sent', {
    p_user_id: userId,
    p_nudge_level: nudgeLevel,
  })

  if (error) {
    console.error('Error updating nudge sent:', error)
    throw new Error(`Failed to update nudge: ${error.message}`)
  }
}

/**
 * Get plan metadata from database
 */
export async function getPlanMetadata(planName: string = 'starter') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_metadata')
    .select('*')
    .eq('plan_name', planName)
    .single()

  if (error) {
    console.error('Error getting plan metadata:', error)
    return null
  }

  return data
}

/**
 * Get all available plans
 */
export async function getAllPlans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_metadata')
    .select('*')
    .order('price_monthly', { ascending: true })

  if (error) {
    console.error('Error getting plans:', error)
    return []
  }

  return data || []
}

/**
 * Check if user is approaching or has exceeded their monthly limit
 */
export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean
  message?: string
  usage?: UsageStats
}> {
  const usage = await getUserUsage(userId)

  if (!usage) {
    return { allowed: true }
  }

  // Enterprise has unlimited tokens (-1)
  if (usage.monthlyCap === -1) {
    return { allowed: true, usage }
  }

  // Check if user has exceeded their limit
  if (usage.tokensUsed >= usage.monthlyCap) {
    return {
      allowed: false,
      message: 'You have reached your monthly token limit. Please upgrade your plan to continue.',
      usage,
    }
  }

  return { allowed: true, usage }
}

/**
 * Format token count for display (e.g., 1000 -> "1K", 1000000 -> "1M")
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

/**
 * Estimate cost based on tokens used and plan
 */
export function estimateCost(tokensUsed: number, overagePrice: number | null): number {
  if (!overagePrice) return 0
  return tokensUsed * overagePrice
}
