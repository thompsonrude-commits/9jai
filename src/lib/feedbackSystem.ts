/**
 * Feedback & Self-Improving AI System
 * Collects user ratings, corrections, and uses them to improve responses
 */

import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { recordFeedback } from './memorySystem';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MessageFeedback {
  id?: string;
  userId: string;
  sessionId: string;
  messageId: string;
  userMessage: string;
  aiResponse: string;
  rating: 1 | 2 | 3 | 4 | 5;
  correction?: string;
  tags?: string[];
  language?: string;
  timestamp: number;
}

export interface FeedbackStats {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: Record<number, number>;
  commonIssues: string[];
  improvementAreas: string[];
}

// ── Save feedback ──────────────────────────────────────────────────────────

export async function saveFeedback(feedback: MessageFeedback): Promise<void> {
  // Save to localStorage for immediate use
  try {
    const key = `feedback_${feedback.userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(feedback);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100))); // keep last 100
  } catch { /* ignore */ }

  // Save to Firestore
  try {
    await addDoc(collection(db, 'ai_feedback'), {
      ...feedback,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Feedback] Firestore save failed:', err);
  }

  // Update user memory
  if (feedback.userId) {
    await recordFeedback(feedback.userId, {
      messageId: feedback.messageId,
      rating: feedback.rating,
      correction: feedback.correction,
    });
  }
}

// ── Get feedback for a user ────────────────────────────────────────────────

export function getUserFeedback(userId: string): MessageFeedback[] {
  try {
    const key = `feedback_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

// ── Build improvement context from feedback ────────────────────────────────
// Injects past corrections into the AI system prompt

export function buildFeedbackContext(userId: string): string {
  const feedback = getUserFeedback(userId);
  if (feedback.length === 0) return '';

  // Get corrections (rating <= 2 with corrections)
  const corrections = feedback
    .filter(f => f.rating <= 2 && f.correction)
    .slice(0, 5);

  if (corrections.length === 0) return '';

  const correctionText = corrections
    .map(f => `- User corrected: "${f.aiResponse.slice(0, 100)}..." → "${f.correction}"`)
    .join('\n');

  return `\n\n## PAST CORRECTIONS (learn from these mistakes):\n${correctionText}`;
}

// ── Feedback stats ─────────────────────────────────────────────────────────

export function calculateFeedbackStats(userId: string): FeedbackStats {
  const feedback = getUserFeedback(userId);

  if (feedback.length === 0) {
    return {
      averageRating: 0,
      totalFeedback: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      commonIssues: [],
      improvementAreas: [],
    };
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  feedback.forEach(f => {
    distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    totalRating += f.rating;
  });

  const avgRating = totalRating / feedback.length;

  // Identify common issues from low-rated feedback
  const lowRated = feedback.filter(f => f.rating <= 2);
  const issues: string[] = [];

  if (lowRated.some(f => f.correction?.toLowerCase().includes('wrong'))) {
    issues.push('Factual accuracy');
  }
  if (lowRated.some(f => f.correction?.toLowerCase().includes('language'))) {
    issues.push('Language quality');
  }
  if (lowRated.some(f => f.correction?.toLowerCase().includes('long') || f.correction?.toLowerCase().includes('short'))) {
    issues.push('Response length');
  }

  return {
    averageRating: Math.round(avgRating * 10) / 10,
    totalFeedback: feedback.length,
    ratingDistribution: distribution,
    commonIssues: issues,
    improvementAreas: issues.length > 0 ? issues : ['Keep up the good work!'],
  };
}

// ── Rating component helper ────────────────────────────────────────────────

export function getRatingEmoji(rating: number): string {
  const emojis: Record<number, string> = {
    1: '😞',
    2: '😕',
    3: '😐',
    4: '😊',
    5: '🤩',
  };
  return emojis[rating] || '⭐';
}

export function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent',
  };
  return labels[rating] || '';
}
