'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, HardDrive, Cpu, MemoryStick, Monitor } from 'lucide-react'

interface SystemRequirement {
  name: string
  required: string
  current: string
  met: boolean
  icon: React.ReactNode
}

export function SystemRequirements() {
  const [requirements, setRequirements] = useState<SystemRequirement[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkSystemRequirements()
  }, [])

  const checkSystemRequirements = async () => {
    setChecking(true)

    try {
      const reqs: SystemRequirement[] = [
        {
          name: 'Operating System',
          required: 'Windows 10 or later',
          current: 'Windows 10', // TODO: Get from Tauri
          met: true,
          icon: <Monitor className="h-5 w-5" />
        },
        {
          name: 'RAM',
          required: '8 GB minimum, 16 GB recommended',
          current: '16 GB', // TODO: Get from Tauri
          met: true,
          icon: <MemoryStick className="h-5 w-5" />
        },
        {
          name: 'Free Disk Space',
          required: '10 GB for models and data',
          current: '250 GB available', // TODO: Get from Tauri
          met: true,
          icon: <HardDrive className="h-5 w-5" />
        },
        {
          name: 'Processor',
          required: 'Multi-core CPU recommended',
          current: 'Intel Core i7', // TODO: Get from Tauri
          met: true,
          icon: <Cpu className="h-5 w-5" />
        }
      ]

      setRequirements(reqs)
    } catch (error) {
      console.error('Failed to check system requirements:', error)
    } finally {
      setChecking(false)
    }
  }

  const allRequirementsMet = requirements.every(r => r.met)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">System Requirements</h3>
          <p className="text-sm text-gray-600">
            Verify your system meets the minimum requirements
          </p>
        </div>
        {!checking && (
          <div className="flex items-center space-x-2">
            {allRequirementsMet ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">All Requirements Met</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">Some Requirements Not Met</span>
              </>
            )}
          </div>
        )}
      </div>

      {checking ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking system...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                req.met
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 mt-0.5 ${req.met ? 'text-green-600' : 'text-yellow-600'}`}>
                  {req.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{req.name}</h4>
                    {req.met ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Required:</strong> {req.required}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Your System:</strong> {req.current}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!checking && !allRequirementsMet && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> Some requirements are not met. The application may not run optimally.
            Consider upgrading your system for the best experience.
          </p>
        </div>
      )}

      {!checking && (
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={checkSystemRequirements}>
            Recheck System
          </Button>
        </div>
      )}
    </Card>
  )
}
