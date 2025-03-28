import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
        gradient: "bg-gradient-to-r from-[hsl(215.3,19.3%,34.5%)] to-[hsl(215.3,19.3%,44.5%)] text-white hover:from-[hsl(215.3,19.3%,30.5%)] hover:to-[hsl(215.3,19.3%,40.5%)] shadow-md",
        soft: "bg-secondary/60 text-primary hover:bg-secondary/80 shadow-sm",
        blue: "bg-[hsl(215.3,19.3%,34.5%)] text-white hover:bg-[hsl(215.3,19.3%,30.5%)] shadow-sm",
        glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-sm",
        "glass-dark": "bg-slate-800/70 backdrop-blur-md border border-slate-700/50 text-white hover:bg-slate-800/90 transition-all duration-300 shadow-sm",
        modern: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all duration-300",
        "modern-outline": "border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300",
        sleek: "relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 after:absolute after:inset-0 after:z-[-1] after:opacity-0 after:bg-gradient-to-r after:from-indigo-600 after:to-blue-600 hover:after:opacity-100 after:transition-opacity after:duration-500",
        brand: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all duration-300",
        "brand-outline": "border-2 border-purple-500 text-purple-600 hover:bg-purple-50 transition-all duration-300",
        "brand-soft": "bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xs: "h-8 rounded-md px-2 text-xs",
        xl: "h-12 rounded-md px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
