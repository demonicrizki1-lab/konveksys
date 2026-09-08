import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string | React.ReactNode;
  note?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  note,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isAlertOnly = !onConfirm;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          icon: <AlertTriangle className="w-7 h-7" />,
          buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          noteBg: 'bg-amber-50/80 border-amber-200/80 text-amber-800',
        };
      case 'info':
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          icon: <Info className="w-7 h-7" />,
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
          noteBg: 'bg-indigo-50/80 border-indigo-200/80 text-indigo-800',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          icon: <CheckCircle2 className="w-7 h-7" />,
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
          noteBg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          icon: isAlertOnly ? <ShieldAlert className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />,
          buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
          noteBg: 'bg-rose-50/80 border-rose-200/80 text-rose-800',
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Centered Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-slideUp z-10">
        {/* Close Button (X) */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-base cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Icon Badge */}
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${currentStyles.iconBg}`}>
          {currentStyles.icon}
        </div>

        {/* Modal Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {title}
        </h3>

        {/* Main Message */}
        <div className="text-sm text-slate-600 mb-4 leading-relaxed">
          {message}
        </div>

        {/* Additional Note / Warning Box */}
        {note && (
          <div className={`text-xs border rounded-xl p-3 mb-5 text-left flex items-start gap-2.5 ${currentStyles.noteBg}`}>
            <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
            <div className="leading-snug">{note}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-base btn-press disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (onConfirm) {
                await onConfirm();
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 font-semibold rounded-xl text-xs sm:text-sm transition-base btn-press shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${currentStyles.buttonBg}`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memproses...
              </span>
            ) : isAlertOnly ? (
              'Mengerti'
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
