import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === "password"
    const inputType = isPassword ? (showPassword ? "text" : "password") : type

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="font-caption text-caption text-on-surface font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              "flex h-[44px] w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 font-body text-body text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
              isPassword && "pr-12",
              error && "border-danger focus:ring-danger focus:border-danger",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm p-1 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="font-caption text-[0.8rem] font-medium text-danger">{error}</p>}
        {!error && helperText && <p className="font-caption text-[0.8rem] text-text-muted">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
