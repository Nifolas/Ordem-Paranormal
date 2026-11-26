"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "md", type = "button", ...props },
    ref
  ) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default:
        "bg-[#16161C] hover:bg-[#1E1E26] text-[#F4F4F5] border border-[#22222A] hover:border-[#32323E]",
      primary:
        "bg-[#F4F4F5] hover:bg-white text-[#09090B] border border-[#F4F4F5] font-semibold",
      secondary:
        "bg-[#101014] hover:bg-[#16161C] text-[#D4D4D8] border border-[#22222A] hover:border-[#32323E]",
      outline:
        "bg-transparent hover:bg-[#16161C] text-[#D4D4D8] hover:text-[#F4F4F5] border border-[#22222A] hover:border-[#32323E]",
      ghost:
        "bg-transparent hover:bg-[#16161C] text-[#8E8E9E] hover:text-[#F4F4F5] border border-transparent",
      danger:
        "bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 hover:border-red-500/50",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      xs: "h-7 px-2.5 text-xs rounded-sm gap-1.5",
      sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
      md: "h-9 px-4 text-sm rounded-sm gap-2",
      lg: "h-10 px-5 text-sm rounded-sm gap-2",
      icon: "h-8 w-8 rounded-sm p-0 justify-center",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-40 disabled:pointer-events-none select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-[#101014] border border-[#22222A] text-[#F4F4F5]",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "danger" | "warning" | "success" | "purple";
}) {
  const styles = {
    default: "bg-[#16161C] text-[#D4D4D8] border-[#22222A]",
    outline: "bg-transparent text-[#8E8E9E] border-[#22222A]",
    danger: "bg-red-600/10 text-red-400 border-red-600/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    success: "bg-emerald-600/10 text-emerald-400 border-emerald-600/30",
    purple: "bg-purple-600/10 text-purple-300 border-purple-600/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, value, onChange, onFocus, onBlur, onWheel, ...props }, ref) => {
  const isNumber = type === "number";
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(
    value === undefined || value === null ? "" : String(value)
  );

  React.useEffect(() => {
    if (!isNumber) return;
    if (!focused) {
      setDraft(value === undefined || value === null ? "" : String(value));
    }
  }, [isNumber, focused, value]);

  if (!isNumber) {
    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onWheel={onWheel}
        className={cn(
          "h-9 w-full rounded-sm bg-[#09090B] border border-[#22222A] px-3 text-sm text-[#F4F4F5] placeholder:text-[#6E6E7E] focus:outline-none focus:border-[#525266] transition-colors",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <input
      ref={ref}
      type="number"
      value={focused ? draft : value ?? ""}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === undefined || value === null ? "" : String(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        setDraft(value === undefined || value === null ? "" : String(value));
        onBlur?.(e);
      }}
      onWheel={(e) => {
        e.currentTarget.blur();
        onWheel?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange?.(e);
      }}
      className={cn(
        "h-9 w-full rounded-sm bg-[#09090B] border border-[#22222A] px-3 text-sm text-[#F4F4F5] placeholder:text-[#6E6E7E] focus:outline-none focus:border-[#525266] transition-colors",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const NumericInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
    value: number;
    onValueChange: (val: number) => void;
    fallback?: number;
  }
>(({ value, onValueChange, fallback = 0, onFocus, onBlur, onWheel, ...props }, ref) => {
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(String(value));

  React.useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [focused, value]);

  return (
    <input
      ref={ref}
      type="number"
      value={focused ? draft : value}
      onFocus={(e) => {
        setFocused(true);
        setDraft(String(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        const parsed = Number(draft);
        const finalVal =
          draft.trim() === "" || Number.isNaN(parsed) ? fallback : parsed;
        if (finalVal !== value) onValueChange(finalVal);
        setDraft(String(finalVal));
        onBlur?.(e);
      }}
      onWheel={(e) => {
        e.currentTarget.blur();
        onWheel?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        if (next.trim() === "" || next === "-") return;
        const parsed = Number(next);
        if (!Number.isNaN(parsed)) {
          onValueChange(parsed);
        }
      }}
      {...props}
    />
  );
});
NumericInput.displayName = "NumericInput";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-sm bg-[#09090B] border border-[#22222A] px-3 py-2.5 text-sm text-[#D4D4D8] leading-relaxed placeholder:text-[#6E6E7E] focus:outline-none focus:border-[#525266] transition-colors resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 w-full rounded-sm bg-[#09090B] border border-[#22222A] px-2.5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#525266] transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
  heightClass = "max-h-[88vh]",
  noPadding = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  heightClass?: string;
  noPadding?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full rounded-md bg-[#101014] border border-[#32323E] shadow-2xl overflow-hidden flex flex-col animate-slide-up-fade",
          maxWidth,
          heightClass
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#22222A] bg-[#0C0C10] px-5 py-4 shrink-0">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[#F4F4F5]">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#8E8E9E] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-[#8E8E9E] hover:text-[#F4F4F5] hover:bg-[#16161C]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={cn("flex-1 min-h-0 overflow-y-auto", !noPadding && "p-5")}>
          {children}
        </div>
      </div>
    </div>
  );
}
