import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

export function Button({
  loading,
  variant = 'primary',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`w-full py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors ${variants[variant]}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}