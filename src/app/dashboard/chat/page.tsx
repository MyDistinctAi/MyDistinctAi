/**
 * Chat Landing Page
 *
 * Redirects to the first available model or shows a message if no models exist
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's models - prioritize models with training data
  const { data: modelsWithData } = await supabase
    .from('models')
    .select(`
      id, 
      name, 
      status,
      document_embeddings(count)
    `)
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .order('updated_at', { ascending: false })

  // Find first model with embeddings (has training data)
  const modelWithData = modelsWithData?.find((m: any) => 
    m.document_embeddings && m.document_embeddings.length > 0 && m.document_embeddings[0].count > 0
  )

  // Redirect to model with data, or fallback to most recent model
  if (modelWithData) {
    redirect(`/dashboard/chat/${(modelWithData as any).id}`)
  } else if (modelsWithData && modelsWithData.length > 0) {
    redirect(`/dashboard/chat/${(modelsWithData[0] as any).id}`)
  }

  // If no models, show a helpful message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No Models Available
        </h1>

        <p className="text-gray-600 mb-6">
          You need to create a model before you can start chatting.
          Models allow you to have AI-powered conversations tailored to your needs.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard/models"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Models
          </Link>

          <Link
            href="/dashboard"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
