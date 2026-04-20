import * as React from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Strips +254 / 254 / leading 0 and returns the local 9-digit part (starting with 7 or 1).
export const toLocal9 = (value: string): string => {
  const digits = (value || "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("254")) local = local.slice(3);
  else if (local.startsWith("0")) local = local.slice(1);
  return local.slice(0, 9);
};

export const toFullKE = (local9: string): string => {
  const d = (local9 || "").replace(/\D/g, "").slice(0, 9);
  return d ? `+254${d}` : "";
};

export const isValidKEMobile = (full: string): boolean => {
  const local = toLocal9(full);
  return /^[71]\d{8}$/.test(local);
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, id, disabled, className, placeholder = "712 345 678" }, ref) => {
    const local = toLocal9(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = toLocal9(e.target.value);
      onChange(next ? `+254${next}` : "");
    };

    return (
      <div
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        <span
          className="flex items-center gap-1.5 px-3 bg-muted/60 border-r border-input text-sm font-medium text-foreground select-none"
          aria-label="Kenya country code"
        >
          <span aria-hidden className="text-base leading-none">🇰🇪</span>
          <span>+254</span>
        </span>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={local}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={9}
          className="flex-1 bg-transparent px-3 py-2 text-base md:text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
    );
  },
);
PhoneInput.displayName = "PhoneInput";
