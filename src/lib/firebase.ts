import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const storage = getStorage(app);

export const uploadAudio = async (path: string, blob: Blob): Promise<string> => {
  // Try Firebase Storage first with a generous timeout
  try {
    const audioRef = ref(storage, path);
    const snapshot = await uploadBytes(audioRef, blob);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (err) {
    console.warn("Firebase Storage upload failed. Falling back to base64 data URL.", err);
    // Fallback: convert to base64 data URL so audio still works locally
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to convert audio to base64"));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
};

export const signIn = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already in use. Please sign in instead.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email not found. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw error;
  }
};

/**
 * Sign out
 */
export const signOut = async () => {
  return firebaseSignOut(auth);
};

export function isFirebaseUnavailableError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';
  const message = error instanceof Error ? error.message : String(error ?? '');

  return (
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    code === 'resource-exhausted' ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    /permission|insufficient permissions|unauthenticated|offline|unavailable|network|failed-precondition/i.test(message)
  );
}

// Validate connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isFirebaseUnavailableError(error)) {
      // Firebase may be intentionally unavailable in local/offline or locked-down environments.
      // The app should continue to run using local fallbacks without noisy console errors.
      return;
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
