/**
 * Package/Subscription Management
 * Defines limits and features for different subscription tiers
 */

export type PackageTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PackageLimits {
  name: string
  maxFileSize: number // in bytes
  maxFilesPerModel: number
  maxModels: number
  maxStorageTotal: number // in bytes
  monthlyTokens: number
  features: string[]
  price: number // monthly price in USD
}

export const PACKAGES: Record<PackageTier, PackageLimits> = {
  free: {
    name: 'Free',
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFilesPerModel: 5,
    maxModels: 3,
    maxStorageTotal: 50 * 1024 * 1024, // 50 MB
    monthlyTokens: 100000,
    features: [
      '3 AI models',
      '5 files per model',
      '10 MB per file',
      '50 MB total storage',
      '100K tokens/month',
      'Basic support',
    ],
    price: 0,
  },
  starter: {
    name: 'Starter',
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    maxFilesPerModel: 10,
    maxModels: 10,
    maxStorageTotal: 500 * 1024 * 1024, // 500 MB
    monthlyTokens: 1000000,
    features: [
      '10 AI models',
      '10 files per model',
      '50 MB per file',
      '500 MB total storage',
      '1M tokens/month',
      'Priority support',
      'Advanced analytics',
    ],
    price: 19,
  },
  pro: {
    name: 'Pro',
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    maxFilesPerModel: 20,
    maxModels: 50,
    maxStorageTotal: 5 * 1024 * 1024 * 1024, // 5 GB
    monthlyTokens: 10000000,
    features: [
      '50 AI models',
      '20 files per model',
      '100 MB per file',
      '5 GB total storage',
      '10M tokens/month',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom branding',
    ],
    price: 49,
  },
  enterprise: {
    name: 'Enterprise',
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    maxFilesPerModel: 100,
    maxModels: 999,
    maxStorageTotal: 50 * 1024 * 1024 * 1024, // 50 GB
    monthlyTokens: 100000000,
    features: [
      'Unlimited models',
      '100 files per model',
      '500 MB per file',
      '50 GB total storage',
      '100M tokens/month',
      '24/7 dedicated support',
      'Advanced analytics',
      'API access',
      'Custom branding',
      'SSO/SAML',
      'Custom integrations',
      'SLA guarantee',
    ],
    price: 199,
  },
}

/**
 * Get package limits for a user
 */
export function getPackageLimits(tier: PackageTier = 'free'): PackageLimits {
  return PACKAGES[tier] || PACKAGES.free
}

/**
 * Check if file size is within package limits
 */
export function isFileSizeAllowed(fileSize: number, tier: PackageTier = 'free'): boolean {
  const limits = getPackageLimits(tier)
  return fileSize <= limits.maxFileSize
}

/**
 * Check if user can add more files to a model
 */
export function canAddMoreFiles(currentFileCount: number, tier: PackageTier = 'free'): boolean {
  const limits = getPackageLimits(tier)
  return currentFileCount < limits.maxFilesPerModel
}

/**
 * Check if user can create more models
 */
export function canCreateMoreModels(currentModelCount: number, tier: PackageTier = 'free'): boolean {
  const limits = getPackageLimits(tier)
  return currentModelCount < limits.maxModels
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get upgrade message for limit exceeded
 */
export function getUpgradeMessage(limitType: 'fileSize' | 'filesPerModel' | 'models' | 'storage', currentTier: PackageTier = 'free'): string {
  const nextTier = getNextTier(currentTier)
  const nextLimits = getPackageLimits(nextTier)
  
  const messages = {
    fileSize: `Upgrade to ${nextLimits.name} to upload files up to ${formatFileSize(nextLimits.maxFileSize)}`,
    filesPerModel: `Upgrade to ${nextLimits.name} to add up to ${nextLimits.maxFilesPerModel} files per model`,
    models: `Upgrade to ${nextLimits.name} to create up to ${nextLimits.maxModels} models`,
    storage: `Upgrade to ${nextLimits.name} for ${formatFileSize(nextLimits.maxStorageTotal)} total storage`,
  }
  
  return messages[limitType]
}

/**
 * Get next tier for upgrades
 */
function getNextTier(currentTier: PackageTier): PackageTier {
  const tiers: PackageTier[] = ['free', 'starter', 'pro', 'enterprise']
  const currentIndex = tiers.indexOf(currentTier)
  return tiers[Math.min(currentIndex + 1, tiers.length - 1)]
}

/**
 * Check all limits and return violations
 */
export interface LimitCheck {
  allowed: boolean
  violations: string[]
  tier: PackageTier
  limits: PackageLimits
}

export function checkLimits(
  fileSize: number,
  currentFileCount: number,
  currentModelCount: number,
  tier: PackageTier = 'free'
): LimitCheck {
  const limits = getPackageLimits(tier)
  const violations: string[] = []

  if (!isFileSizeAllowed(fileSize, tier)) {
    violations.push(`File size exceeds ${formatFileSize(limits.maxFileSize)} limit`)
  }

  if (!canAddMoreFiles(currentFileCount, tier)) {
    violations.push(`Maximum ${limits.maxFilesPerModel} files per model reached`)
  }

  if (!canCreateMoreModels(currentModelCount, tier)) {
    violations.push(`Maximum ${limits.maxModels} models reached`)
  }

  return {
    allowed: violations.length === 0,
    violations,
    tier,
    limits,
  }
}
