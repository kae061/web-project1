import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-bold text-zinc-700 ml-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-white border border-zinc-200 rounded-2xl p-4
          text-[#1a1a1a] placeholder:text-zinc-400 outline-none
          focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-500 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
