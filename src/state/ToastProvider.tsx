import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ToastKind } from '../types';
import { TOAST_MS } from '../lib/constants';

type ShowToast = (msg: string, kind?: ToastKind) => void;

interface ToastState {
  msg: string;
  kind: ToastKind;
  id: number;
}

const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback<ShowToast>((msg, kind = 'info') => {
    setToast({ msg, kind, id: Date.now() + Math.random() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const showing = toast !== null;
  const errorClass = toast?.kind === 'error' ? 'error' : '';

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${showing ? 'show' : ''} ${errorClass}`.trim()}>
        {toast?.msg ?? ''}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
