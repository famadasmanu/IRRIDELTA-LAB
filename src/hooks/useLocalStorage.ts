import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'users', user.uid, 'appData', key);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().value as T;
        const cloudString = JSON.stringify(cloudData);
        const localString = window.localStorage.getItem(key);

        // Prevent infinite loops and unnecessary re-renders
        if (cloudString !== localString) {
          setStoredValue(cloudData);
          window.localStorage.setItem(key, cloudString);
        }
      } else {
        // First sync: if cloud is empty, push local data to cloud
        setDoc(docRef, { value: storedValue }, { merge: true }).catch(console.error);
      }
    }, (error) => {
      console.error("Firebase sync error:", error);
    });

    return () => unsubscribe();
  }, [user, key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      if (user) {
        const docRef = doc(db, 'users', user.uid, 'appData', key);
        setDoc(docRef, { value: valueToStore }, { merge: true }).catch(console.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
