'use client'

/**
 * Desktop Loading State Components
 * 
 * Reusable loading indicators for consistent UX
 */

import React from 'react'

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b border-gray-200">
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                    <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
                </div>
            ))}
        </div>
    )
}

/**
 * Card skeleton loader
 */
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-3">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg" />
            </div>
        </div>
    )
}

/**
 * Grid of card skeletons
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

/**
 * Full page loader
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-blue-100" />
                </div>
            </div>
            <p className="mt-4 text-gray-600 text-sm">{message}</p>
        </div>
    )
}

/**
 * Inline spinner
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    }

    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizes[size]}`} />
    )
}

/**
 * Button with loading state
 */
export function LoadingButton({
    loading,
    children,
    className = '',
    ...props
}: {
    loading: boolean
    children: React.ReactNode
    className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className={`inline-flex items-center justify-center ${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {loading && <Spinner size="sm" />}
            <span className={loading ? 'ml-2' : ''}>{children}</span>
        </button>
    )
}

/**
 * Progress bar
 */
export function ProgressBar({
    progress,
    className = '',
    color = 'blue'
}: {
    progress: number
    className?: string
    color?: 'blue' | 'green' | 'purple' | 'orange'
}) {
    const colors = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        orange: 'bg-orange-600'
    }

    return (
        <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
            <div
                className={`h-2 rounded-full transition-all duration-300 ${colors[color]}`}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
        </div>
    )
}
