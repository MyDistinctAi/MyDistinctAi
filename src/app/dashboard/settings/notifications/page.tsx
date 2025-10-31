/**
 * Notifications Settings Page
 *
 * Configure email and in-app notification preferences
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, Mail, MessageSquare, Save, Loader2, Check } from 'lucide-react'

interface NotificationSettings {
  emailNotifications: boolean
  trainingCompleteEmail: boolean
  newMessageEmail: boolean
  weeklyReportEmail: boolean
  inAppNotifications: boolean
  trainingCompleteInApp: boolean
  newMessageInApp: boolean
  systemUpdatesInApp: boolean
  usageLimitWarnings: boolean
  securityAlerts: boolean
}

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    trainingCompleteEmail: true,
    newMessageEmail: false,
    weeklyReportEmail: false,
    inAppNotifications: true,
    trainingCompleteInApp: true,
    newMessageInApp: true,
    systemUpdatesInApp: true,
    usageLimitWarnings: true,
    securityAlerts: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      // Get notification settings from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching notification settings:', userError)
        // Use default settings if none exist
      } else if (userData?.notification_settings) {
        setSettings({
          ...settings,
          ...userData.notification_settings,
        })
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        return
      }

      // Update notification settings in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating notification settings:', updateError)
        setError('Failed to save notification settings')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error in handleSaveSettings:', err)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Settings
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Notification Settings
          </h1>
          <p className="text-gray-600">
            Configure your email and in-app notification preferences
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-green-800">Settings saved successfully!</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Notifications
            </h2>

            <div className="space-y-4">
              {/* Master Email Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Enable Email Notifications</p>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Training Complete Email */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Training Complete</p>
                  <p className="text-sm text-gray-600">
                    Get notified when model training is complete
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('trainingCompleteEmail')}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.trainingCompleteEmail && settings.emailNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.trainingCompleteEmail && settings.emailNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* New Message Email */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Messages</p>
                  <p className="text-sm text-gray-600">
                    Get notified about new chat messages (can be noisy)
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('newMessageEmail')}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.newMessageEmail && settings.emailNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.newMessageEmail && settings.emailNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Weekly Report Email */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Report</p>
                  <p className="text-sm text-gray-600">
                    Receive a weekly summary of your AI usage
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReportEmail')}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.weeklyReportEmail && settings.emailNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.emailNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.weeklyReportEmail && settings.emailNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              In-App Notifications
            </h2>

            <div className="space-y-4">
              {/* Master In-App Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Enable In-App Notifications</p>
                  <p className="text-sm text-gray-600">
                    Show notifications within the application
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('inAppNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.inAppNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.inAppNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Training Complete In-App */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Training Complete</p>
                  <p className="text-sm text-gray-600">
                    Show notification when model training is complete
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('trainingCompleteInApp')}
                  disabled={!settings.inAppNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.trainingCompleteInApp && settings.inAppNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.inAppNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.trainingCompleteInApp && settings.inAppNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* New Message In-App */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Messages</p>
                  <p className="text-sm text-gray-600">
                    Show notification for new chat messages
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('newMessageInApp')}
                  disabled={!settings.inAppNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.newMessageInApp && settings.inAppNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.inAppNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.newMessageInApp && settings.inAppNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">System Updates</p>
                  <p className="text-sm text-gray-600">
                    Show notifications for platform updates and new features
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('systemUpdatesInApp')}
                  disabled={!settings.inAppNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.systemUpdatesInApp && settings.inAppNotifications
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } ${!settings.inAppNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.systemUpdatesInApp && settings.inAppNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Important Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Important Alerts
            </h2>

            <div className="space-y-4">
              {/* Usage Limit Warnings */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Usage Limit Warnings</p>
                  <p className="text-sm text-gray-600">
                    Get notified when approaching usage limits (recommended)
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('usageLimitWarnings')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.usageLimitWarnings ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.usageLimitWarnings ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Security Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Security Alerts</p>
                  <p className="text-sm text-gray-600">
                    Get notified about security events and login attempts (recommended)
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('securityAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.securityAlerts ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
