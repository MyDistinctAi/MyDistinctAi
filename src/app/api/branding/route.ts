/**
 * Branding API Route
 *
 * Handles saving and updating branding configurations
 */

import { createClient } from '@/lib/supabase/server'
import { updateBranding } from '@/lib/branding/getBranding'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { userId, ...brandingData } = body

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate required fields
    if (!brandingData.companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Validate domain format if provided
    if (brandingData.domain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
      if (!domainRegex.test(brandingData.domain)) {
        return NextResponse.json(
          { error: 'Invalid domain format' },
          { status: 400 }
        )
      }

      // Check if domain is already taken by another user
      const { data: existingDomain } = await supabase
        .from('branding_config')
        .select('user_id')
        .eq('domain', brandingData.domain)
        .single() as { data: { user_id: string } | null }

      if (existingDomain && existingDomain.user_id !== userId) {
        return NextResponse.json(
          { error: 'Domain is already taken' },
          { status: 400 }
        )
      }
    }

    // Validate color formats
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (
      brandingData.primaryColor &&
      !colorRegex.test(brandingData.primaryColor)
    ) {
      return NextResponse.json(
        { error: 'Invalid primary color format' },
        { status: 400 }
      )
    }
    if (
      brandingData.secondaryColor &&
      !colorRegex.test(brandingData.secondaryColor)
    ) {
      return NextResponse.json(
        { error: 'Invalid secondary color format' },
        { status: 400 }
      )
    }

    // Update branding using the utility function
    const result = await updateBranding(userId, brandingData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save branding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Branding saved successfully',
    })
  } catch (error) {
    console.error('Branding API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's branding config
    const { data, error } = await supabase
      .from('branding_config')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Branding fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch branding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      branding: data || null,
    })
  } catch (error) {
    console.error('Branding API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
