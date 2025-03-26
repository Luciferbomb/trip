import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        brand: 
          "bg-transparent data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-indigo-600 data-[state=on]:text-white hover:bg-purple-100 dark:hover:bg-purple-900/20",
        "brand-soft":
          "bg-transparent data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 hover:bg-purple-50 dark:data-[state=on]:bg-purple-900/20 dark:data-[state=on]:text-purple-300",
        "brand-outline":
          "border border-purple-400 bg-transparent hover:bg-purple-100/50 hover:text-purple-700 data-[state=on]:border-purple-500 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 dark:border-purple-700 dark:data-[state=on]:bg-purple-900/30",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
