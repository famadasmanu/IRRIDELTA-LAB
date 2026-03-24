import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CompanyConfig {
  nombre: string;
  cuit: string;
  direccion: string;
  terminos: string;
  logo: string;
  showLogoInDashboard: boolean;
}

const DEFAULT_COMPANY: CompanyConfig = {
  nombre: 'Argent Software',
  cuit: '30-12345678-9',
  direccion: 'Av. Libertador 1234, CABA',
  terminos: '',
  logo: '',
  showLogoInDashboard: true
};

export function useCompanyConfig() {
  const [data, setData] = useState<CompanyConfig>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'public_config', 'empresa'), (snap) => {
      if (snap.exists()) {
        const firestoreData = snap.data() as Partial<CompanyConfig>;
        // Fallback robusto para no arrastrar logos de caché viejos que caigan por error
        if (firestoreData.logo?.includes('googleusercontent.com')) {
           firestoreData.logo = '';
        }
        setData({ ...DEFAULT_COMPANY, ...firestoreData });
      }
      setLoading(false);
    }, (err) => {
      console.warn("Public config (Company) fetch error: ", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateData = async (newData: CompanyConfig) => {
    setData(newData); // Optimistic wrap
    try {
      await setDoc(doc(db, 'public_config', 'empresa'), newData, { merge: true });
    } catch (err) {
      console.error("No tienes permisos nivel Dios para cambiar el logo", err);
      alert("No tienes permisos suficientes (Dueño) para modificar la configuración global de la empresa.");
    }
  };

  return [data, updateData, loading] as const;
}
