import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "error" | "warning" | "success" | "info";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  onDismiss?: () => void;
}

const variantConfig: Record<
  AlertVariant,
  { container: string; iconBg: string; iconColor: string; titleColor: string; textColor: string }
> = {
  error: {
    container: "bg-red-50 border border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },
  warning: {
    container: "bg-amber-50 border border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    textColor: "text-amber-700",
  },
  success: {
    container: "bg-emerald-50 border border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-800",
    textColor: "text-emerald-700",
  },
  info: {
    container: "bg-blue-50 border border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
};

function DefaultIcon({ variant }: { variant: AlertVariant }) {
  if (variant === "success")
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  if (variant === "error")
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  if (variant === "warning")
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

export function Alert({
  variant = "info",
  title,
  icon,
  onDismiss,
  children,
  className,
  ...props
}: AlertProps) {
  const cfg = variantConfig[variant];

  return (
    <div
      className={cn("flex gap-3 rounded-lg px-4 py-3.5 animate-fade-in-up", cfg.container, className)}
      role="alert"
      {...props}
    >
      {/* Icon */}
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5", cfg.iconBg, cfg.iconColor)}>
        {icon ?? <DefaultIcon variant={variant} />}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("text-sm font-semibold leading-tight", cfg.titleColor)}>{title}</p>
        )}
        <div className={cn("text-sm leading-snug", title ? "mt-0.5" : "", cfg.textColor)}>
          {children}
        </div>
      </div>

      {/* Optional dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn("shrink-0 ml-1 hover:opacity-70 transition-opacity", cfg.iconColor)}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
