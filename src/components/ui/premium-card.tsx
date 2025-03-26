import { cn } from "@/lib/utils"
import React from "react"

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "glass" | "neon"
  glowColor?: string
  children: React.ReactNode
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = "default", glowColor = "#ff2975", children, ...props }, ref) => {
    const baseStyles = "relative rounded-xl backdrop-blur-xl transition-all duration-300"
    
    const variants = {
      default: `
        bg-white/90 border border-gray-100
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
      `,
      gradient: `
        bg-gradient-to-br from-white via-white/95 to-white/90
        border border-gray-100
        before:absolute before:inset-0 before:-z-10 
        before:rounded-xl before:bg-gradient-to-br 
        before:from-[#ff2975]/10 before:to-[#00FFF1]/10
        before:blur-xl
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
      `,
      glass: `
        bg-white/60 border border-white
        backdrop-blur-xl 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]
        before:absolute before:inset-0 before:-z-10
        before:rounded-xl before:bg-gradient-to-br
        before:from-white/40 before:to-white/20
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]
      `,
      neon: `
        bg-white/90 border-2
        shadow-[0_0_15px_0_${glowColor}]
        border-[${glowColor}]
        animate-glow
      `
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          "hover:scale-[1.02] hover:shadow-2xl",
          className
        )}
        {...props}
      >
        <div className="relative z-10 p-6">
          {children}
        </div>
      </div>
    )
  }
)

PremiumCard.displayName = "PremiumCard" 