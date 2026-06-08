import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// Use modern persistent cache API (Firebase 10+) instead of deprecated enableIndexedDbPersistence
export const db = initializeFirestore(app, { localCache: persistentLocalCache() });
export const auth = getAuth(app);

export function ensureSignedIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) {
        resolve(user.uid);
      } else {
        signInAnonymously(auth).then(c => resolve(c.user.uid)).catch(reject);
      }
    });
  });
}
