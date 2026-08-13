/**
 * Chat History — Firestore-backed persistent conversation storage
 *
 * Architecture:
 *   Primary:  Firestore `chat_sessions` collection (cross-device, permanent)
 *   Fallback: localStorage (guests / offline)
 *
 * Each session document:
 *   chat_sessions/{sessionId}  {
 *     userId, title, language, messages[], createdAt, updatedAt, messageCount
 *   }
 */

import { db, auth } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, updateDoc,
} from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PersistedMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
  imagePrompt?: string;
  imgType?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  language: string;
  messages: PersistedMessage[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// ── Local storage fallback keys ────────────────────────────────────────────

const LS_SESSIONS_KEY  = (uid: string) => `chat_sessions_${uid}`;
const MAX_LS_MESSAGES  = 100; // cap per session in localStorage
const MAX_LS_SESSIONS  = 30;  // cap total sessions in localStorage
const MAX_FS_SESSIONS  = 100; // cap in Firestore

// ── Helpers ────────────────────────────────────────────────────────────────

function currentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateTitle(messages: PersistedMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New Conversation';
  const text = first.content.replace(/\s+/g, ' ').trim();
  return text.length > 50 ? text.slice(0, 47) + '…' : text;
}

// ── localStorage helpers ───────────────────────────────────────────────────

function lsGetSessions(userId: string): ChatSession[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SESSIONS_KEY(userId)) || '[]');
  } catch { return []; }
}

function lsSaveSessions(userId: string, sessions: ChatSession[]): void {
  try {
    // Keep only most recent MAX_LS_SESSIONS
    const trimmed = sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_LS_SESSIONS);
    localStorage.setItem(LS_SESSIONS_KEY(userId), JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}

function lsSaveSession(userId: string, session: ChatSession): void {
  const sessions = lsGetSessions(userId);
  const idx = sessions.findIndex(s => s.id === session.id);
  const trimmedSession = {
    ...session,
    messages: session.messages.slice(-MAX_LS_MESSAGES),
  };
  if (idx >= 0) {
    sessions[idx] = trimmedSession;
  } else {
    sessions.unshift(trimmedSession);
  }
  lsSaveSessions(userId, sessions);
}

// ── Core API ───────────────────────────────────────────────────────────────

/**
 * Save or update a chat session.
 * Writes to Firestore if user is authenticated, localStorage always.
 */
export async function saveSession(session: ChatSession): Promise<void> {
  const uid = session.userId || currentUserId();
  if (!uid) return;

  const toSave: ChatSession = {
    ...session,
    userId: uid,
    updatedAt: Date.now(),
    messageCount: session.messages.length,
    title: session.title || generateTitle(session.messages),
  };

  // Always update localStorage immediately (fast)
  lsSaveSession(uid, toSave);

  // Persist to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const ref = doc(db, 'chat_sessions', toSave.id);
      await setDoc(ref, {
        ...toSave,
        // Keep only last 200 messages in Firestore per session
        messages: toSave.messages.slice(-200),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[ChatHistory] Firestore save failed:', err);
    }
  }
}

/**
 * Create a brand new session and save it.
 */
export function createSession(userId?: string, language = 'pcm'): ChatSession {
  const uid = userId || currentUserId() || 'anonymous';
  return {
    id: generateSessionId(),
    userId: uid,
    title: 'New Conversation',
    language,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  };
}

/**
 * Load all sessions for a user, Firestore first then localStorage fallback.
 */
export async function loadSessions(userId?: string): Promise<ChatSession[]> {
  const uid = userId || currentUserId();
  if (!uid) return [];

  // Authenticated — try Firestore
  if (auth.currentUser) {
    try {
      const q = query(
        collection(db, 'chat_sessions'),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(MAX_FS_SESSIONS)
      );
      const snap = await getDocs(q);
      const sessions = snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          // Firestore Timestamps → number
          createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? Date.now(),
        } as ChatSession;
      });

      // Sync to localStorage for offline access
      lsSaveSessions(uid, sessions);
      return sessions;
    } catch (err) {
      console.warn('[ChatHistory] Firestore load failed, using localStorage:', err);
    }
  }

  // Fallback: localStorage
  return lsGetSessions(uid).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Load a single session by ID.
 */
export async function loadSession(sessionId: string, userId?: string): Promise<ChatSession | null> {
  const uid = userId || currentUserId();
  if (!uid) return null;

  // Try Firestore first
  if (auth.currentUser) {
    try {
      const ref = doc(db, 'chat_sessions', sessionId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          id: snap.id,
          createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? Date.now(),
        } as ChatSession;
      }
    } catch (err) {
      console.warn('[ChatHistory] Firestore session load failed:', err);
    }
  }

  // localStorage fallback
  return lsGetSessions(uid).find(s => s.id === sessionId) ?? null;
}

/**
 * Delete a session.
 */
export async function deleteSession(sessionId: string, userId?: string): Promise<void> {
  const uid = userId || currentUserId();
  if (!uid) return;

  // Remove from localStorage
  const sessions = lsGetSessions(uid).filter(s => s.id !== sessionId);
  lsSaveSessions(uid, sessions);

  // Remove from Firestore
  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
    } catch (err) {
      console.warn('[ChatHistory] Firestore delete failed:', err);
    }
  }
}

/**
 * Delete all sessions for a user.
 */
export async function clearAllSessions(userId?: string): Promise<void> {
  const uid = userId || currentUserId();
  if (!uid) return;

  // Clear localStorage
  localStorage.removeItem(LS_SESSIONS_KEY(uid));

  // Clear Firestore
  if (auth.currentUser) {
    try {
      const q = query(
        collection(db, 'chat_sessions'),
        where('userId', '==', uid),
        limit(MAX_FS_SESSIONS)
      );
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch (err) {
      console.warn('[ChatHistory] Firestore clear failed:', err);
    }
  }
}

/**
 * Append a message to an existing session (fast path — avoids loading all messages).
 */
export async function appendMessage(
  session: ChatSession,
  message: PersistedMessage
): Promise<ChatSession> {
  const updated: ChatSession = {
    ...session,
    messages: [...session.messages, message],
    updatedAt: Date.now(),
    messageCount: session.messages.length + 1,
    title: session.title === 'New Conversation' && message.role === 'user'
      ? generateTitle([message])
      : session.title,
  };
  await saveSession(updated);
  return updated;
}

/**
 * Migrate localStorage sessions to Firestore (called after user signs in).
 */
export async function migrateLocalSessionsToFirestore(userId: string): Promise<void> {
  if (!auth.currentUser) return;

  const localSessions = lsGetSessions(userId);
  if (localSessions.length === 0) return;

  try {
    await Promise.all(
      localSessions.slice(0, 20).map(session =>
        setDoc(
          doc(db, 'chat_sessions', session.id),
          {
            ...session,
            userId,
            messages: session.messages.slice(-200),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      )
    );
    console.info(`[ChatHistory] Migrated ${localSessions.length} sessions to Firestore`);
  } catch (err) {
    console.warn('[ChatHistory] Migration failed:', err);
  }
}
