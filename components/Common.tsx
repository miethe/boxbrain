import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Plus } from 'lucide-react';

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'gray' | 'red' | 'yellow' }> = ({ children, color = 'gray' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-amber-100 text-amber-800 border-amber-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]} inline-flex items-center`}>
      {children}
    </span>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }> = ({ className = '', variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  };
  return (
    <button 
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input 
      className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
      focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
      disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: string[] }> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select 
      className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    >
      <option value="">Select...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea 
      className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
      focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      rows={4}
      {...props}
    />
  </div>
);

export interface MultiSelectProps {
  label?: string;
  value: string | string[];
  options: string[];
  onChange: (value: string | string[]) => void;
  creatable?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  options,
  onChange,
  creatable = false,
  multiple = false,
  placeholder = 'Select...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (multiple) {
      if (selectedValues.includes(option)) {
        onChange(selectedValues.filter(v => v !== option));
      } else {
        onChange([...selectedValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
    setInputValue('');
  };

  const handleCreate = () => {
    if (!inputValue.trim()) return;
    handleSelect(inputValue.trim());
  };

  const handleRemove = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (multiple) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange('');
    }
  };

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(inputValue.toLowerCase()) &&
    (multiple ? !selectedValues.includes(opt) : true)
  );
  
  const showCreate = creatable && inputValue && !options.some(o => o.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      
      <div 
        className="w-full min-h-[38px] px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 cursor-text flex flex-wrap gap-1.5 items-center"
        onClick={() => setIsOpen(true)}
      >
        {selectedValues.map(val => (
          <span key={val} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md flex items-center text-xs font-medium">
            {val}
            <button onClick={(e) => handleRemove(e, val)} type="button" className="ml-1 hover:text-blue-900 rounded-full">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        <div className="flex-1 min-w-[60px] flex items-center">
            <input
                type="text"
                className="w-full bg-transparent outline-none placeholder-slate-400 h-full min-h-[24px]"
                placeholder={selectedValues.length === 0 ? placeholder : ''}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (showCreate) handleCreate();
                        else if (filteredOptions.length > 0) handleSelect(filteredOptions[0]);
                    }
                    if (e.key === 'Backspace' && !inputValue && selectedValues.length > 0) {
                        handleSelect(selectedValues[selectedValues.length - 1]); // Deselect last
                    }
                }}
            />
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1 cursor-pointer" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between
                        ${selectedValues.includes(opt) ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}
                    `}
                >
                    {opt}
                    {selectedValues.includes(opt) && <Check className="w-4 h-4" />}
                </button>
            ))}
            
            {showCreate && (
                <button
                    type="button"
                    onClick={handleCreate}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create "{inputValue}"
                </button>
            )}

            {!showCreate && filteredOptions.length === 0 && (
                <div className="px-4 py-2 text-sm text-slate-500">No options found</div>
            )}
        </div>
      )}
    </div>
  );
};