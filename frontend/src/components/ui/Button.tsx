import React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      primary: "bg-primary text-white hover:opacity-90 shadow-sm",
      secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white shadow-sm",
      outline: "bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high shadow-sm",
      ghost: "hover:bg-surface-container-high text-on-surface-variant",
      danger: "bg-danger text-white hover:opacity-90 shadow-sm"
    }
    
    const sizes = {
      sm: "h-8 px-3 font-caption text-caption",
      md: "h-10 px-4 py-2 font-body text-body",
      lg: "h-[44px] px-6 font-body text-body-lg",
      icon: "h-10 w-10"
    }

    // Default to 'outline' instead of 'secondary' for backward compatibility if needed, but 'secondary' in design is purple.
    const resolvedVariant = variant === "secondary" && !variants["secondary"] ? "outline" : variant;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[resolvedVariant as keyof typeof variants] || variants.primary, sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
