"use strict";
/**
 * Nigeria Regional Optimization System
 * Optimized for MTN, Airtel, Glo, 9mobile networks
 * Handles low-bandwidth, unstable connections, regional incompatibilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNigerianCarrier = detectNigerianCarrier;
exports.measureNetworkConditions = measureNetworkConditions;
exports.estimateNetworkCondition = estimateNetworkCondition;
exports.classifyNetworkQuality = classifyNetworkQuality;
exports.selectRenderingMode = selectRenderingMode;
exports.getNigeriaOptimizationProfile = getNigeriaOptimizationProfile;
exports.getMultiRegionRoutingConfig = getMultiRegionRoutingConfig;
exports.detectAndFailover = detectAndFailover;
exports.getAuthStabilizationConfig = getAuthStabilizationConfig;
exports.getServiceWorkerConfig = getServiceWorkerConfig;
exports.getImageOptimizationConfig = getImageOptimizationConfig;
exports.getAdaptiveLoadingStrategy = getAdaptiveLoadingStrategy;
/**
 * Detect Nigerian carrier from device/network info
 */
function detectNigerianCarrier() {
    // Detect via network info API or fallback detection
    try {
        const connection = navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;
        if (connection?.carrierName) {
            const carrier = connection.carrierName.toLowerCase();
            if (carrier.includes('mtn'))
                return 'mtn';
            if (carrier.includes('airtel'))
                return 'airtel';
            if (carrier.includes('glo'))
                return 'glo';
            if (carrier.includes('9mobile'))
                return '9mobile';
        }
    }
    catch (_) { }
    return 'unknown';
}
/**
 * Measure actual network conditions
 */
async function measureNetworkConditions() {
    const carrier = detectNigerianCarrier();
    try {
        const connection = navigator.connection;
        if (connection) {
            return {
                bandwidth: connection.downlink || 5000,
                latency: connection.rtt || 50,
                packetLoss: connection.effectiveType === '4g' ? 0 :
                    connection.effectiveType === '3g' ? 5 :
                        connection.effectiveType === '2g' ? 15 : 10,
                carrier
            };
        }
    }
    catch (_) { }
    // Fallback: estimate based on carrier
    return estimateNetworkCondition(carrier);
}
/**
 * Estimate network condition by carrier
 */
function estimateNetworkCondition(carrier) {
    const estimates = {
        mtn: { bandwidth: 8000, latency: 45, packetLoss: 2, carrier: 'mtn' },
        airtel: { bandwidth: 7000, latency: 50, packetLoss: 3, carrier: 'airtel' },
        glo: { bandwidth: 6000, latency: 55, packetLoss: 4, carrier: 'glo' },
        '9mobile': { bandwidth: 5000, latency: 60, packetLoss: 5, carrier: '9mobile' },
        unknown: { bandwidth: 5000, latency: 100, packetLoss: 5, carrier: 'unknown' }
    };
    return estimates[carrier] || estimates.unknown;
}
/**
 * Classify network quality
 */
function classifyNetworkQuality(condition) {
    if (condition.bandwidth > 10000 && condition.latency < 30 && condition.packetLoss < 1) {
        return 'excellent';
    }
    if (condition.bandwidth > 5000 && condition.latency < 50 && condition.packetLoss < 3) {
        return 'good';
    }
    if (condition.bandwidth > 2000 && condition.latency < 100 && condition.packetLoss < 5) {
        return 'fair';
    }
    if (condition.bandwidth > 1000 && condition.latency < 200) {
        return 'poor';
    }
    return 'critical';
}
/**
 * Select optimal rendering mode
 */
function selectRenderingMode(quality) {
    switch (quality) {
        case 'excellent':
            return 'full';
        case 'good':
            return 'adaptive';
        case 'fair':
            return 'lite';
        case 'poor':
        case 'critical':
            return 'minimal';
        default:
            return 'adaptive';
    }
}
/**
 * Get optimization profile for Nigerian conditions
 */
async function getNigeriaOptimizationProfile() {
    const conditions = await measureNetworkConditions();
    const quality = classifyNetworkQuality(conditions);
    const renderingMode = selectRenderingMode(quality);
    const profiles = {
        excellent: {
            imageQuality: 'high',
            cacheDuration: 86400000, // 24 hours
            preloadStrategy: 'aggressive',
            compressionLevel: 6,
            retryAttempts: 3
        },
        good: {
            imageQuality: 'medium',
            cacheDuration: 43200000, // 12 hours
            preloadStrategy: 'moderate',
            compressionLevel: 7,
            retryAttempts: 3
        },
        fair: {
            imageQuality: 'medium',
            cacheDuration: 21600000, // 6 hours
            preloadStrategy: 'conservative',
            compressionLevel: 8,
            retryAttempts: 5
        },
        poor: {
            imageQuality: 'low',
            cacheDuration: 10800000, // 3 hours
            preloadStrategy: 'conservative',
            compressionLevel: 9,
            retryAttempts: 7
        },
        critical: {
            imageQuality: 'low',
            cacheDuration: 3600000, // 1 hour
            preloadStrategy: 'conservative',
            compressionLevel: 9,
            retryAttempts: 10
        }
    };
    const baseProfile = profiles[quality] || profiles.fair;
    return {
        carrier: conditions.carrier,
        network: quality,
        renderingMode,
        imageQuality: baseProfile.imageQuality || 'medium',
        cacheDuration: baseProfile.cacheDuration || 21600000,
        preloadStrategy: baseProfile.preloadStrategy || 'moderate',
        compressionLevel: baseProfile.compressionLevel || 7,
        retryAttempts: baseProfile.retryAttempts || 5
    };
}
/**
 * Firebase Multi-Region Routing Configuration
 */
function getMultiRegionRoutingConfig() {
    return {
        primaryRegion: 'africa-south1', // South Africa for Africa access
        fallbackRegions: [
            'us-central1', // USA as backup
            'europe-west1', // Europe as fallback
            'asia-southeast1' // Asia as last resort
        ],
        autoFailover: true,
        healthCheckInterval: 30000 // Check every 30 seconds
    };
}
/**
 * Automatic failover detection
 */
async function detectAndFailover(primaryUrl) {
    const config = getMultiRegionRoutingConfig();
    if (!config.autoFailover)
        return primaryUrl;
    // Test primary region
    try {
        const response = await Promise.race([
            fetch(primaryUrl, { method: 'HEAD' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        if (response instanceof Response && response.ok) {
            return primaryUrl;
        }
    }
    catch (_) { }
    // Primary failed, try fallbacks
    for (const fallback of config.fallbackRegions) {
        try {
            const fallbackUrl = primaryUrl.replace(/[a-z-]+\.a\.run\.app/, `${fallback}-run.app`);
            const response = await Promise.race([
                fetch(fallbackUrl, { method: 'HEAD' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            if (response instanceof Response && response.ok) {
                console.log(`[Regional] Failover to ${fallback}`);
                return fallbackUrl;
            }
        }
        catch (_) { }
    }
    // All failed, return primary (user can retry)
    return primaryUrl;
}
function getAuthStabilizationConfig() {
    return {
        tokenRefreshInterval: 300000, // Refresh every 5 minutes
        offlineAuthCache: true, // Cache auth state
        fallbackAuthMethod: true, // Use offline auth if needed
        retryWithBackoff: true // Exponential backoff on auth failures
    };
}
function getServiceWorkerConfig(quality) {
    const maxCacheSizes = {
        excellent: 100 * 1024 * 1024, // 100 MB
        good: 50 * 1024 * 1024, // 50 MB
        fair: 25 * 1024 * 1024, // 25 MB
        poor: 10 * 1024 * 1024, // 10 MB
        critical: 5 * 1024 * 1024 // 5 MB
    };
    return {
        enablePrecaching: quality === 'excellent' || quality === 'good',
        enableNetworkFirst: quality === 'excellent',
        enableCacheFirst: quality === 'poor' || quality === 'critical',
        enableStaleWhileRevalidate: true,
        maxCacheSize: maxCacheSizes[quality] || maxCacheSizes.fair
    };
}
function getImageOptimizationConfig(quality) {
    const configs = {
        excellent: {
            format: 'webp',
            quality: 85,
            maxWidth: 1024,
            maxHeight: 1024,
            enablePictureElement: true
        },
        good: {
            format: 'webp',
            quality: 75,
            maxWidth: 800,
            maxHeight: 800,
            enablePictureElement: true
        },
        fair: {
            format: 'jpg',
            quality: 65,
            maxWidth: 600,
            maxHeight: 600,
            enablePictureElement: true
        },
        poor: {
            format: 'jpg',
            quality: 55,
            maxWidth: 400,
            maxHeight: 400,
            enablePictureElement: false
        },
        critical: {
            format: 'jpg',
            quality: 45,
            maxWidth: 300,
            maxHeight: 300,
            enablePictureElement: false
        }
    };
    return configs[quality] || configs.fair;
}
/**
 * Adaptive Loading Strategy
 */
async function getAdaptiveLoadingStrategy() {
    const profile = await getNigeriaOptimizationProfile();
    const imageConfig = getImageOptimizationConfig(profile.network);
    const swConfig = getServiceWorkerConfig(profile.network);
    return {
        profile,
        imageConfig,
        serviceWorkerConfig: swConfig,
        prioritizeCore: profile.network === 'poor' || profile.network === 'critical',
        deferNonEssential: profile.network !== 'excellent'
    };
}
//# sourceMappingURL=nigeriaOptimization.js.map