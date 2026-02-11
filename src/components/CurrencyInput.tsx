import * as React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number; // value in cents
  onValueChange: (cents: number) => void;
}

function formatCents(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  const str = abs.toString().padStart(3, '0');
  const intPart = str.slice(0, -2);
  const decPart = str.slice(-2);
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formatted},${decPart}`;
}

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      onValueChange(Math.floor(value / 10));
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      onValueChange(0);
      return;
    }

    const digit = e.key;
    if (/^\d$/.test(digit)) {
      e.preventDefault();
      const newVal = value * 10 + parseInt(digit);
      if (newVal <= 99999999999) { // max ~R$ 999.999.999,99
        onValueChange(newVal);
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatCents(value)}
      onKeyDown={handleKeyDown}
      onChange={() => {}} // controlled via onKeyDown
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

// Helper to convert cents to BRL number (e.g. 15050 -> 150.50)
export function centsToReal(cents: number): number {
  return cents / 100;
}

// Helper to convert BRL number to cents (e.g. 150.50 -> 15050)
export function realToCents(real: number): number {
  return Math.round(real * 100);
}
