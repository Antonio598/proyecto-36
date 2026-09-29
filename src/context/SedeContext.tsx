'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, getAccountId } from '@/lib/apiFetch';

interface Subaccount {
  id: string;
  name: string;
}

interface SedeContextType {
  sedes: Subaccount[];
  selectedSede: string;
  setSelectedSede: (id: string) => void;
  isLoading: boolean;
}

const SedeContext = createContext<SedeContextType | undefined>(undefined);

export function SedeProvider({ children }: { children: ReactNode }) {
  const [sedes, setSedes] = useState<Subaccount[]>([]);
  const [selectedSede, setSelectedSedeState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSedes() {
      try {
        const res = await apiFetch('/api/subaccounts');
        if (res.ok) {
          const data = await res.json();
          setSedes(data);

          const currentAccountId = getAccountId();
          const stored = localStorage.getItem('med_selected_sede');
          const storedAccountId = localStorage.getItem('med_sede_account');

          // Only use the stored sede if it belongs to the CURRENT account
          const storedIsValid =
            stored &&
            storedAccountId === currentAccountId &&
            data.find((s: Subaccount) => s.id === stored);

          if (storedIsValid) {
            setSelectedSedeState(stored);
          } else if (data.length > 0) {
            // Reset to first (main) sede — clears stale selection from another account
            setSelectedSedeState(data[0].id);
            localStorage.setItem('med_selected_sede', data[0].id);
            localStorage.setItem('med_sede_account', currentAccountId || '');
          }
        }
      } catch (error) {
        console.error('Error fetching sedes for context:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSedes();
  }, []);

  const setSelectedSede = (id: string) => {
    setSelectedSedeState(id);
    localStorage.setItem('med_selected_sede', id);
    localStorage.setItem('med_sede_account', getAccountId() || '');
  };

  return (
    <SedeContext.Provider value={{ sedes, selectedSede, setSelectedSede, isLoading }}>
      {children}
    </SedeContext.Provider>
  );
}

export function useSede() {
  const context = useContext(SedeContext);
  if (context === undefined) {
    throw new Error('useSede must be used within a SedeProvider');
  }
  return context;
}
