/**
 * Session Manager
 * Manages user sessions, chat history, and page state persistence
 */

export interface ChatSession {
  id: string;
  languageId: string;
  languageName: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  title: string;
}

export interface UserLibrary {
  userId: string;
  sessions: ChatSession[];
  favorites: string[]; // Session IDs
  lastActiveSessionId: string | null;
}

const SESSION_STORAGE_KEY = 'user_sessions';
const ACTIVE_SESSION_KEY = 'active_session_id';
const USER_LIBRARY_KEY = 'user_library';

/**
 * Get all user sessions from localStorage
 */
export function getUserSessions(userId: string): ChatSession[] {
  try {
    const data = localStorage.getItem(`${SESSION_STORAGE_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}

/**
 * Save a chat session
 */
export function saveChatSession(userId: string, session: ChatSession): void {
  try {
    const sessions = getUserSessions(userId);
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: Date.now() };
    } else {
      sessions.push({ ...session, createdAt: Date.now(), updatedAt: Date.now() });
    }
    
    localStorage.setItem(`${SESSION_STORAGE_KEY}_${userId}`, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving chat session:', error);
  }
}

/**
 * Get a specific session by ID
 */
export function getSessionById(userId: string, sessionId: string): ChatSession | null {
  try {
    const sessions = getUserSessions(userId);
    return sessions.find(s => s.id === sessionId) || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete a session
 */
export function deleteSession(userId: string, sessionId: string): void {
  try {
    const sessions = getUserSessions(userId);
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(`${SESSION_STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Set active session
 */
export function setActiveSession(userId: string, sessionId: string): void {
  try {
    localStorage.setItem(`${ACTIVE_SESSION_KEY}_${userId}`, sessionId);
  } catch (error) {
    console.error('Error setting active session:', error);
  }
}

/**
 * Get active session ID
 */
export function getActiveSessionId(userId: string): string | null {
  try {
    return localStorage.getItem(`${ACTIVE_SESSION_KEY}_${userId}`);
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Create a new session
 */
export function createNewSession(
  userId: string,
  languageId: string,
  languageName: string,
  title?: string
): ChatSession {
  const session: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    languageId,
    languageName,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: title || `${languageName} Chat - ${new Date().toLocaleDateString()}`,
  };
  
  saveChatSession(userId, session);
  setActiveSession(userId, session.id);
  
  return session;
}

/**
 * Get user library
 */
export function getUserLibrary(userId: string): UserLibrary {
  try {
    const data = localStorage.getItem(`${USER_LIBRARY_KEY}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
    
    return {
      userId,
      sessions: getUserSessions(userId),
      favorites: [],
      lastActiveSessionId: getActiveSessionId(userId),
    };
  } catch (error) {
    console.error('Error getting user library:', error);
    return {
      userId,
      sessions: [],
      favorites: [],
      lastActiveSessionId: null,
    };
  }
}

/**
 * Add session to favorites
 */
export function addToFavorites(userId: string, sessionId: string): void {
  try {
    const library = getUserLibrary(userId);
    if (!library.favorites.includes(sessionId)) {
      library.favorites.push(sessionId);
      localStorage.setItem(`${USER_LIBRARY_KEY}_${userId}`, JSON.stringify(library));
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
}

/**
 * Remove session from favorites
 */
export function removeFromFavorites(userId: string, sessionId: string): void {
  try {
    const library = getUserLibrary(userId);
    library.favorites = library.favorites.filter(id => id !== sessionId);
    localStorage.setItem(`${USER_LIBRARY_KEY}_${userId}`, JSON.stringify(library));
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
}

/**
 * Export session as JSON
 */
export function exportSession(session: ChatSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Export session as text
 */
export function exportSessionAsText(session: ChatSession): string {
  let text = `${session.title}\n`;
  text += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
  text += `Language: ${session.languageName}\n`;
  text += `\n${'='.repeat(50)}\n\n`;
  
  session.messages.forEach((msg, idx) => {
    text += `[${msg.role.toUpperCase()}]\n`;
    text += `${msg.content}\n\n`;
  });
  
  return text;
}

/**
 * Clear all sessions for a user
 */
export function clearAllSessions(userId: string): void {
  try {
    localStorage.removeItem(`${SESSION_STORAGE_KEY}_${userId}`);
    localStorage.removeItem(`${ACTIVE_SESSION_KEY}_${userId}`);
    localStorage.removeItem(`${USER_LIBRARY_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}
