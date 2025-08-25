'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  persistent?: boolean;
}

interface CustomToasterProps {
  isEnabled?: boolean;
  autoShow?: boolean;
  autoShowDelay?: number;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
  buttonUrl?: string;
  persistent?: boolean;
  cookieKey?: string;
}

export function CustomToaster({
  isEnabled = false,
  autoShow = false,
  autoShowDelay = 3000,
  title = 'Notification',
  description = 'This is a notification message.',
  type = 'info',
  buttonText,
  buttonUrl,
  persistent = true,
  cookieKey = 'toaster-dismissed',
}: CustomToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the toaster before
    const checkDismissed = () => {
      if (typeof document !== 'undefined') {
        const dismissed = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${cookieKey}=`));
        if (dismissed) {
          setHasBeenDismissed(true);
          return true;
        }
      }
      return false;
    };

    const isDismissed = checkDismissed();

    if (isEnabled && autoShow && !isDismissed) {
      const timer = setTimeout(() => {
        showToast(title, description, type);
      }, autoShowDelay);

      return () => clearTimeout(timer);
    }
  }, [isEnabled, autoShow, autoShowDelay, title, description, type, cookieKey]);

  const showToast = (
    toastTitle: string,
    toastDescription?: string,
    toastType: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      title: toastTitle,
      description: toastDescription,
      type: toastType,
      persistent,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Save cookie when user dismisses the toaster
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // Cookie expires in 30 days
      document.cookie = `${cookieKey}=true; expires=${expires.toUTCString()}; path=/`;
      setHasBeenDismissed(true);
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'info':
      default:
        return 'border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
    }
  };

  if (!isEnabled || hasBeenDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex flex-col gap-3 rounded-lg border p-6 shadow-lg transition-all duration-300 ease-in-out',
            'animate-in slide-in-from-left-full',
            getToastStyles(toast.type)
          )}
          style={{ maxWidth: '500px', minWidth: '400px' }}
        >
          <div className="flex items-start gap-3">
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base">{toast.title}</h4>
              {toast.description && (
                <p className="text-sm opacity-90 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {buttonText && buttonUrl && (
            <div className="flex justify-end">
              <a
                href={buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                {buttonText}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Export the showToast function for external use
export const showCustomToast = (
  title: string,
  description?: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  persistent: boolean = false
) => {
  // This would need to be implemented with a global state management solution
  // For now, you can use the built-in toast from your existing setup
  console.log('Toast triggered:', { title, description, type, persistent });
};
