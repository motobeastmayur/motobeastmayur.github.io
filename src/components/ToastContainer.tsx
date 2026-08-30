import React from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        let borderColor = 'border-[#00f3ff]/40';
        let glowColor = 'shadow-[0_0_15px_rgba(0,243,255,0.25)]';
        let icon = <Info className="w-4 h-4 text-[#00f3ff] flex-shrink-0" />;

        if (isWarning) {
          borderColor = 'border-amber-500/50';
          glowColor = 'shadow-[0_0_15px_rgba(245,158,11,0.25)]';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
        } else if (isError) {
          borderColor = 'border-red-500/50';
          glowColor = 'shadow-[0_0_15px_rgba(239,68,68,0.25)]';
          icon = <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
        } else if (isSuccess) {
          borderColor = 'border-emerald-500/50';
          glowColor = 'shadow-[0_0_15px_rgba(16,185,129,0.25)]';
          icon = <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/95 backdrop-blur-2xl border ${borderColor} ${glowColor} text-neutral-100 text-xs sm:text-sm animate-fade-in transition-all`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="font-medium text-neutral-200 leading-snug">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
