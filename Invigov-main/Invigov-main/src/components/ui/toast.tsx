"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const duration = opts.duration ?? 4500;
      setToasts((prev) => [...prev, { ...opts, id }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ type: "success", message, title }),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ type: "error", message, title, duration: 6000 }),
    [toast]
  );
  const warning = useCallback(
    (message: string, title?: string) => toast({ type: "warning", message, title }),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ type: "info", message, title }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toastStyles: Record<ToastType, { container: string; icon: string; progress: string }> = {
  success: {
    container: "bg-white border-l-4 border-emerald-500 shadow-lg shadow-emerald-50",
    icon: "bg-emerald-50 text-emerald-600",
    progress: "bg-emerald-500",
  },
  error: {
    container: "bg-white border-l-4 border-red-500 shadow-lg shadow-red-50",
    icon: "bg-red-50 text-red-600",
    progress: "bg-red-500",
  },
  warning: {
    container: "bg-white border-l-4 border-amber-500 shadow-lg shadow-amber-50",
    icon: "bg-amber-50 text-amber-600",
    progress: "bg-amber-500",
  },
  info: {
    container: "bg-white border-l-4 border-blue-500 shadow-lg shadow-blue-50",
    icon: "bg-blue-50 text-blue-600",
    progress: "bg-blue-500",
  },
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "success")
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  if (type === "error")
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  if (type === "warning")
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
};

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const styles = toastStyles[toast.type];
  const duration = toast.duration ?? 4500;

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(show);
  }, []);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg px-4 py-3.5 pr-10 w-full max-w-sm pointer-events-auto transition-all duration-300",
        styles.container,
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      )}
      role="alert"
    >
      {/* Icon */}
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", styles.icon)}>
        <ToastIcon type={toast.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
        )}
        <p className="text-sm text-gray-600 leading-snug mt-0.5">{toast.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={() => dismiss(toast.id)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={cn("absolute bottom-0 left-0 h-0.5 rounded-b-lg", styles.progress)}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}
