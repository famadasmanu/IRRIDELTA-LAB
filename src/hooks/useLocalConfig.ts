import { useState, useEffect } from 'react';

export function useLocalConfig<T>(key: string, initialValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      const version = window.localStorage.getItem('config_version');
      if (item) {
        let parsed = JSON.parse(item);
        if (key === 'config_company' && version !== 'v2') {
          parsed.logo = '/logo.png';
          window.localStorage.setItem(key, JSON.stringify(parsed));
          window.localStorage.setItem('config_version', 'v2');
        }
        return parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      if (e instanceof CustomEvent && e.detail.key === key) {
        setValue(e.detail.value);
      }
    };
    window.addEventListener('localConfigChange', handleStorageChange);
    
    // Also listen to storage events from other tabs
    const handleTabStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', handleTabStorageChange);
    
    return () => {
      window.removeEventListener('localConfigChange', handleStorageChange);
      window.removeEventListener('storage', handleTabStorageChange);
    };
  }, [key]);

  const setConfigValue = (newValue: T) => {
    setValue(newValue);
    window.localStorage.setItem(key, JSON.stringify(newValue));
    window.dispatchEvent(new CustomEvent('localConfigChange', { detail: { key, value: newValue } }));
  };

  return [value, setConfigValue];
}
