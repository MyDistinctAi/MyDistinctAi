'use client'

/**
 * File Upload Component
 *
 * Drag-and-drop file upload with validation and progress tracking
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, FileText, FileSpreadsheet, AlertCircle, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  modelId: string
  onUploadComplete?: () => void
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.csv']

export default function FileUpload({ modelId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    }

    return null
  }

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending',
      error: validateFile(file) || undefined,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = e.dataTransfer.files
      handleFiles(droppedFiles)
    },
    [handleFiles]
  )

  // Handle click to browse
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Remove file from list
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Upload file to Supabase Storage
  const uploadFile = async (uploadedFile: UploadedFile) => {
    if (uploadedFile.error) return

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f))
      )

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Generate unique file path
      const fileExt = uploadedFile.file.name.split('.').pop()
      const fileName = `${user.id}/${modelId}/${Date.now()}-${uploadedFile.file.name}`

      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('training-data')
        .upload(fileName, uploadedFile.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) {
        throw storageError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('training-data').getPublicUrl(fileName)

      // Save metadata to database
      const { data: insertedData, error: dbError } = await supabase
        .from('training_data')
        .insert({
          model_id: modelId,
          file_name: uploadedFile.file.name,
          file_url: publicUrl,
          file_size: uploadedFile.file.size,
          file_type: uploadedFile.file.type || fileExt,
          status: 'uploaded',
        })
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      // Update status to success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
        )
      )

      // Enqueue file for background processing via job queue
      if (insertedData) {
        fetch('/api/jobs/enqueue-file-processing', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trainingDataId: insertedData.id,
            modelId,
            fileUrl: publicUrl,
            fileName: uploadedFile.file.name,
            fileType: uploadedFile.file.type || fileExt,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              console.error('Failed to enqueue file processing:', res.statusText)
            } else {
              console.log('File processing job enqueued successfully')
            }
          })
          .catch((error) => {
            console.error('Failed to enqueue file processing:', error)
            // Don't throw - let the upload succeed even if enqueueing fails
          })
      }

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      console.error('Upload error:', error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      )
    }
  }

  // Upload all pending files
  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending' && !f.error)

    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'pdf':
        return <File className="h-8 w-8 text-red-500" />
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      case 'txt':
      case 'md':
        return <FileText className="h-8 w-8 text-gray-500" />
      default:
        return <File className="h-8 w-8 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 text-gray-400">
            <Upload className="h-full w-full" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>

          <div className="text-xs text-gray-500">
            <p>Supported formats: PDF, DOCX, TXT, MD, CSV</p>
            <p>Maximum file size: 10MB per file</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Files ({files.length})
            </h3>
            {files.some((f) => f.status === 'pending' && !f.error) && (
              <button
                onClick={uploadAllFiles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Upload All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg"
              >
                {/* File Icon */}
                <div className="flex-shrink-0">{getFileIcon(uploadedFile.file.name)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(uploadedFile.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {uploadedFile.status === 'success' && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {uploadedFile.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {uploadedFile.status === 'pending' && !uploadedFile.error && (
                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Remove file"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadedFile.error && (
                    <div className="mt-2 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{uploadedFile.error}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {uploadedFile.status === 'success' && (
                    <p className="text-xs text-green-600 mt-2">Upload successful!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
