import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "neutral" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  warning:
    "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
  error:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  neutral:
    "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
  info:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
