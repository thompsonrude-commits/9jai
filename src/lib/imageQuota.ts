/**
 * Image Generation Quota System
 * Limits image generation per user like ChatGPT does
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UserImageQuota {
  userId: string;
  email: string;
  imagesGeneratedToday: number;
  imagesGeneratedThisMonth: number;
  lastResetDate: string;
  lastResetMonth: string;
  plan: 'free' | 'premium' | 'pro';
  createdAt: any;
  updatedAt: any;
}

// Quota limits per plan
export const QUOTA_LIMITS = {
  free: {
    perDay: 10,
    perMonth: 50,
  },
  premium: {
    perDay: 50,
    perMonth: 200,
  },
  pro: {
    perDay: -1, // unlimited
    perMonth: -1, // unlimited
  },
};

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get user's quota status
 */
export async function getUserQuota(userId: string, email: string): Promise<UserImageQuota> {
  const quotaRef = doc(db, 'imageQuotas', userId);
  const quotaSnap = await getDoc(quotaRef);
  
  const currentDate = getCurrentDate();
  const currentMonth = getCurrentMonth();
  
  if (!quotaSnap.exists()) {
    // Create new quota record
    const newQuota: UserImageQuota = {
      userId,
      email,
      imagesGeneratedToday: 0,
      imagesGeneratedThisMonth: 0,
      lastResetDate: currentDate,
      lastResetMonth: currentMonth,
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(quotaRef, newQuota);
    return newQuota;
  }
  
  const quota = quotaSnap.data() as UserImageQuota;
  
  // Reset daily counter if new day
  if (quota.lastResetDate !== currentDate) {
    quota.imagesGeneratedToday = 0;
    quota.lastResetDate = currentDate;
  }
  
  // Reset monthly counter if new month
  if (quota.lastResetMonth !== currentMonth) {
    quota.imagesGeneratedThisMonth = 0;
    quota.lastResetMonth = currentMonth;
  }
  
  // Update if reset occurred
  if (quota.lastResetDate !== quotaSnap.data().lastResetDate || quota.lastResetMonth !== quotaSnap.data().lastResetMonth) {
    await updateDoc(quotaRef, {
      imagesGeneratedToday: quota.imagesGeneratedToday,
      imagesGeneratedThisMonth: quota.imagesGeneratedThisMonth,
      lastResetDate: quota.lastResetDate,
      lastResetMonth: quota.lastResetMonth,
      updatedAt: serverTimestamp(),
    });
  }
  
  return quota;
}

/**
 * Check if user can generate an image
 */
export async function canGenerateImage(userId: string, email: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: { daily: number; monthly: number };
}> {
  const quota = await getUserQuota(userId, email);
  const limits = QUOTA_LIMITS[quota.plan];
  
  // Check daily limit
  if (limits.perDay !== -1 && quota.imagesGeneratedToday >= limits.perDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${limits.perDay} images/day). Try again tomorrow or upgrade to Premium.`,
    };
  }
  
  // Check monthly limit
  if (limits.perMonth !== -1 && quota.imagesGeneratedThisMonth >= limits.perMonth) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limits.perMonth} images/month). Upgrade to generate more images.`,
    };
  }
  
  return {
    allowed: true,
    remaining: {
      daily: limits.perDay === -1 ? -1 : limits.perDay - quota.imagesGeneratedToday,
      monthly: limits.perMonth === -1 ? -1 : limits.perMonth - quota.imagesGeneratedThisMonth,
    },
  };
}

/**
 * Record an image generation
 */
export async function recordImageGeneration(userId: string): Promise<void> {
  const quotaRef = doc(db, 'imageQuotas', userId);
  const quotaSnap = await getDoc(quotaRef);
  
  if (!quotaSnap.exists()) {
    throw new Error('Quota record not found. Call getUserQuota first.');
  }
  
  const quota = quotaSnap.data() as UserImageQuota;
  
  await updateDoc(quotaRef, {
    imagesGeneratedToday: quota.imagesGeneratedToday + 1,
    imagesGeneratedThisMonth: quota.imagesGeneratedThisMonth + 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Upgrade user plan
 */
export async function upgradeUserPlan(userId: string, plan: 'free' | 'premium' | 'pro'): Promise<void> {
  const quotaRef = doc(db, 'imageQuotas', userId);
  
  await updateDoc(quotaRef, {
    plan,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get quota display text
 */
export function getQuotaDisplayText(quota: UserImageQuota): string {
  const limits = QUOTA_LIMITS[quota.plan];
  
  if (limits.perDay === -1) {
    return '∞ Unlimited images';
  }
  
  const dailyRemaining = limits.perDay - quota.imagesGeneratedToday;
  const monthlyRemaining = limits.perMonth - quota.imagesGeneratedThisMonth;
  
  return `${dailyRemaining} images left today · ${monthlyRemaining} this month`;
}
