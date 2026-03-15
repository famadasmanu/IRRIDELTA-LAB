import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';

export function useFirestoreCollection<T extends DocumentData>(
  collectionName: string, 
  queryConstraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionName);
    
    // Solo pasamos constraints si hay alguno
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as (T & { id: string })[];
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(queryConstraints)]);

  const add = async (item: Omit<T, 'id'>) => {
    return await addDoc(collection(db, collectionName), item);
  };

  const update = async (id: string, item: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    return await updateDoc(docRef, item as any);
  };

  const remove = async (id: string) => {
    const docRef = doc(db, collectionName, id);
    return await deleteDoc(docRef);
  };

  return { data, loading, error, add, update, remove };
}
