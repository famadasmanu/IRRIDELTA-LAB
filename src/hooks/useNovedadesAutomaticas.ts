import { useState, useEffect, useCallback } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';

export type Fuente = {
  id?: string;
  activo: boolean;
  socio: string;
  urlRss: string;
  createdAt?: string;
};

export type Novedad = {
  id: string;
  link: string;
  isInstagram: boolean;
  imagen: string;
  titulo: string;
  socio: string;
  fecha: Date | number;
  descripcion: string;
};

export function useNovedadesAutomaticas() {
  const { data: fuentes, add, remove, update } = useFirestoreCollection<Fuente>('novedades_fuentes');
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const fetchNovedades = useCallback(async () => {
    setLoading(true);
    setErrorCount(0);
    try {
      // Simulate network request for scraping/fetching RSS feeds
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const activeFuentes = fuentes.filter(f => f.activo);
      
      const mockedNovedades: Novedad[] = [];
      let errCount = 0;

      activeFuentes.forEach((fuente, index) => {
        // Randomly simulate an error for some sources to match the UI behavior
        if (Math.random() > 0.9) {
          errCount++;
          return;
        }

        const isInsta = fuente.urlRss.includes('instagram.com');
        
        mockedNovedades.push({
          id: `nov-${index}-${Date.now()}`,
          link: fuente.urlRss,
          isInstagram: isInsta,
          imagen: isInsta ? 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1000' : 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000',
          titulo: isInsta ? `Nueva publicación de ${fuente.socio}` : `Actualización importante de ${fuente.socio}`,
          socio: fuente.socio,
          fecha: new Date(Date.now() - Math.random() * 100000000),
          descripcion: `Esta es una novedad obtenida automáticamente desde el sistema para el socio ${fuente.socio}. Aquí se mostraría el contenido extraído del feed RSS o del post de Instagram.`
        });
      });

      // Sort by newest first
      mockedNovedades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setNovedades(mockedNovedades);
      setErrorCount(errCount);
    } catch (e) {
      console.error("Error fetching novedades:", e);
      setErrorCount(fuentes.length);
    } finally {
      setLoading(false);
    }
  }, [fuentes]);

  // Initial fetch when fuentes change
  useEffect(() => {
    if (fuentes.length > 0) {
      fetchNovedades();
    } else {
      setNovedades([]);
      setLoading(false);
    }
  }, [fuentes, fetchNovedades]);

  const addUrl = async (url: string) => {
    try {
      let socioName = 'Socio Desconocido';
      
      // Auto-detect from instagram domain
      if (url.includes('instagram.com/')) {
        const parts = url.split('instagram.com/');
        if (parts[1]) {
           socioName = parts[1].split('/')[0].replace('@', '');
        }
      } else {
        // Simple domain extract for others
        try {
          const urlObj = new URL(url);
          socioName = urlObj.hostname.replace('www.', '').split('.')[0];
        } catch {
          socioName = 'Nuevo Socio';
        }
      }
      
      // Capitalize first letter
      socioName = socioName.charAt(0).toUpperCase() + socioName.slice(1);

      await add({
        activo: true,
        socio: socioName,
        urlRss: url,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error adding fuente:", e);
      return false;
    }
  };

  return {
    novedades,
    loading,
    errorCount,
    fuentes,
    fetchNovedades,
    addUrl,
    remove,
    update
  };
}