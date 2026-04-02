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
      
      const imgCategories = {
        irrigation: [
          'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=1000', // Sprinkler
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000', // Water
          'https://images.unsplash.com/photo-1628183204907-88abeb7a5611?w=1000'  // Fields
        ],
        tools: [
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1000', // Workshop
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000', // Tools
          'https://images.unsplash.com/photo-1621259182978-fbf93132e53d?w=1000'  // Drill
        ],
        garden: [
          'https://images.unsplash.com/photo-1584622650111-993a426fcd0a?w=1000', // Garden
          'https://images.unsplash.com/photo-1416879590558-450f75e71465?w=1000'  // Landscaping
        ],
        pool: [
          'https://images.unsplash.com/photo-1576013551627-0cc20b96f1d2?w=1000', // Pool
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000'  // Pool items
        ],
        default: [
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000', // Tech
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000', // Tech workspace
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000' // Business graph
        ]
      };

      activeFuentes.forEach((fuente, index) => {
        // Randomly simulate an error for some sources to match the UI behavior
        if (Math.random() > 0.9) {
          errCount++;
          return;
        }

        const isInsta = fuente.urlRss.includes('instagram.com');
        const searchStr = (fuente.socio + " " + fuente.urlRss).toLowerCase();
        
        let category: keyof typeof imgCategories = 'default';
        if (searchStr.match(/irri|rain|agua|water|hunter|delta|agri|campo/)) category = 'irrigation';
        else if (searchStr.match(/mundi|tool|motor|honda|stihl|husqvarna|maquina/)) category = 'tools';
        else if (searchStr.match(/jard|garden|landscap/)) category = 'garden';
        else if (searchStr.match(/pool|pileta|piscina|vulcano/)) category = 'pool';

        const imgList = imgCategories[category];
        const selectedImage = imgList[index % imgList.length];
        
        mockedNovedades.push({
          id: `nov-${index}-${Date.now()}`,
          link: fuente.urlRss,
          isInstagram: isInsta,
          imagen: selectedImage,
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