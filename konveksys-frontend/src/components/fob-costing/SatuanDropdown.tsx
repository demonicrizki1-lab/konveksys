import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export const SATUAN_OPTIONS = ['Yard', 'Meter', 'Kg', 'Pcs', 'Lusin', 'Kodi', 'Gross'];

interface SatuanDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const SatuanDropdown: React.FC<SatuanDropdownProps> = ({
  value,
  onChange,
  options = SATUAN_OPTIONS,
  className = '',
  size = 'sm',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize current selected value
  const currentVal = (value || '').trim();
  const matched = options.find(opt => opt.toLowerCase() === currentVal.toLowerCase());
  const displayLabel = matched || currentVal || 'Meter';

  // Build full options list (preserve custom if not in standard list)
  const fullOptions = React.useMemo(() => {
    const list = [...options];
    if (currentVal && !options.some(opt => opt.toLowerCase() === currentVal.toLowerCase())) {
      list.unshift(currentVal);
    }
    return list;
  }, [options, currentVal]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 200 && rect.top > 200;

    setCoords({
      top: openUpward ? undefined : rect.bottom + 2,
      bottom: openUpward ? window.innerHeight - rect.top + 2 : undefined,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const sizeClasses =
    size === 'md'
      ? 'h-9 px-2.5 text-xs sm:text-sm rounded-lg'
      : 'h-8 px-2 text-xs rounded-md';

  return (
    <div className={`relative inline-block w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full ${sizeClasses} flex items-center justify-between gap-1 font-semibold border transition-all duration-150 cursor-pointer select-none ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 text-indigo-700'
            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 shadow-2xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop for click outside */}
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu - exact width of trigger */}
            <div
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: coords.width,
                zIndex: 9999,
              }}
              className="bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden py-0.5 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 flex flex-col"
            >
              <div className="max-h-52 overflow-y-auto py-0.5">
                {fullOptions.map(opt => {
                  const isSelected = opt.toLowerCase() === displayLabel.toLowerCase();
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={`w-full px-2 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
