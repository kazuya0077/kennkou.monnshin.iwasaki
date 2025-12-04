import React from 'react';
import { Check, Circle } from 'lucide-react';

// モダンなラジオボタンカード
interface RadioCardProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (val: string) => void;
  className?: string;
}

export const RadioCard: React.FC<RadioCardProps> = ({ name, value, label, checked, onChange, className = '' }) => {
  return (
    <label 
      className={`
        relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${checked 
          ? 'border-medical-600 bg-medical-50 shadow-md transform scale-[1.01]' 
          : 'border-slate-200 bg-white hover:border-medical-300 hover:bg-slate-50'}
        ${className}
      `}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only" // Hide default radio
      />
      <div className={`
        w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0
        ${checked ? 'border-medical-600' : 'border-slate-300'}
      `}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-medical-600" />}
      </div>
      <span className={`font-bold ${checked ? 'text-medical-900' : 'text-slate-700'}`}>
        {label}
      </span>
    </label>
  );
};

// モダンなチェックボックスカード
interface CheckboxCardProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export const CheckboxCard: React.FC<CheckboxCardProps> = ({ label, checked, onChange, className = '' }) => {
  return (
    <label 
      className={`
        relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${checked 
          ? 'border-medical-600 bg-medical-50 shadow-md' 
          : 'border-slate-200 bg-white hover:border-medical-300 hover:bg-slate-50'}
        ${className}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`
        w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0
        ${checked ? 'bg-medical-600 border-medical-600' : 'border-slate-300 bg-white'}
      `}>
        {checked && <Check size={14} className="text-white" />}
      </div>
      <span className={`font-bold ${checked ? 'text-medical-900' : 'text-slate-700'}`}>
        {label}
      </span>
    </label>
  );
};

// ステップ用のボタン
export const ActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled, variant = 'primary', children, className = '' }) => {
  const baseStyles = "py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-95";
  
  const variants = {
    primary: "bg-medical-600 text-white hover:bg-medical-700 disabled:bg-slate-300 disabled:text-slate-500",
    secondary: "bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'cursor-not-allowed shadow-none transform-none' : ''}`}
    >
      {children}
    </button>
  );
};