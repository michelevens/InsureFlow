import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, Search } from 'lucide-react';
import { api } from '@/services/api/client';

export interface ZipCodeResult {
  zip: string;
  city: string;
  state: string;
  county: string | null;
}

export interface AddressAutocompleteProps {
  /** Current ZIP code value */
  value: string;
  /** Called when ZIP code changes (user typing or selection) */
  onChange: (zip: string) => void;
  /** Called when a result is selected — provides city, state, county for auto-fill */
  onSelect?: (result: ZipCodeResult) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Additional class names for the wrapper */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Input name attribute */
  name?: string;
  /** Whether to auto-focus the input */
  autoFocus?: boolean;
  /** Maximum length for the ZIP field (default 5) */
  maxLength?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label,
  placeholder = 'Enter ZIP code or city',
  error,
  helperText,
  className,
  disabled = false,
  name,
  autoFocus,
  maxLength = 5,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<ZipCodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = useCallback(async (query: string) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();

    const isZip = /^\d+$/.test(query);

    // For ZIP codes, auto-lookup on exactly 5 digits
    if (isZip && query.length === 5) {
      setIsLoading(true);
      try {
        const data = await api.get<ZipCodeResult[]>(`/zip-codes/${query}`);
        setResults(data);
        if (data.length > 0) {
          setIsOpen(true);
          setHighlightIndex(0);
          // Auto-select if there is exactly one result
          if (data.length === 1 && onSelect) {
            onSelect(data[0]);
            setSelectedCity(`${data[0].city}, ${data[0].state}`);
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
          setSelectedCity('');
        }
      } catch {
        // API unavailable — graceful fallback, user can still type manually
        setResults([]);
        setIsOpen(false);
        setSelectedCity('');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For partial ZIP (2-4 digits) or city name (2+ chars), search
    if (query.length >= 2) {
      setIsLoading(true);
      try {
        const data = await api.get<ZipCodeResult[]>(`/zip-codes/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setIsOpen(data.length > 0);
        setHighlightIndex(data.length > 0 ? 0 : -1);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Too short — clear results
    setResults([]);
    setIsOpen(false);
  }, [onSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const isZip = /^\d*$/.test(val);

    // If typing digits, enforce maxLength
    if (isZip && val.length > maxLength) return;

    onChange(val);
    setSelectedCity('');

    // Debounce the API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 300);
  };

  const handleSelect = (result: ZipCodeResult) => {
    onChange(result.zip);
    setSelectedCity(`${result.city}, ${result.state}`);
    setIsOpen(false);
    setResults([]);
    setHighlightIndex(-1);
    if (onSelect) onSelect(result);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => (i - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    // Re-open if we have results
    if (results.length > 0 && !selectedCity) {
      setIsOpen(true);
    }
  };

  const inputId = name || 'zip_code';

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shield-500/30',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-200 focus:border-shield-500 hover:border-slate-300',
          )}
        />

        {/* City/State badge shown after selection */}
        {selectedCity && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-shield-600 bg-shield-50 px-2 py-1 rounded-md">
            <Search className="w-3 h-3" />
            {selectedCity}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {results.map((result, index) => (
            <li
              key={`${result.zip}-${result.city}-${result.state}`}
              role="option"
              aria-selected={highlightIndex === index}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                highlightIndex === index
                  ? 'bg-shield-50 text-shield-700'
                  : 'text-slate-700 hover:bg-slate-50',
                index === 0 && 'rounded-t-xl',
                index === results.length - 1 && 'rounded-b-xl',
              )}
            >
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{result.zip}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-sm truncate">{result.city}, {result.state}</span>
                </div>
                {result.county && (
                  <p className="text-xs text-slate-400 mt-0.5">{result.county} County</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Loading state with no results yet */}
      {isOpen && isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Looking up location...
        </div>
      )}

      {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
}
