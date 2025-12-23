/**
 * Desktop mode utilities
 * Helper functions for detecting desktop mode and route conversion
 */

/**
 * Check if running in Tauri desktop mode
 */
export function isDesktopMode(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Convert web routes to desktop routes
 * @param webRoute - Web route like /dashboard/models
 * @returns Desktop route like /desktop/dashboard/models
 */
export function getDesktopRoute(webRoute: string): string {
    // Already a desktop route
    if (webRoute.startsWith('/desktop')) {
        return webRoute
    }

    // Convert dashboard routes
    if (webRoute.startsWith('/dashboard')) {
        return `/desktop${webRoute}`
    }

    // Convert auth routes
    if (webRoute.startsWith('/login') || webRoute.startsWith('/signup')) {
        return '/desktop/auth/login'
    }

    return webRoute
}

/**
 * Get web route from desktop route (reverse conversion)
 */
export function getWebRoute(desktopRoute: string): string {
    if (desktopRoute.startsWith('/desktop/dashboard')) {
        return desktopRoute.replace('/desktop', '')
    }
    return desktopRoute
}
