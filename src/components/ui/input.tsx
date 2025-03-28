import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "text-foreground dark:text-white",
          "[appearance:textfield]",
          "[&::-webkit-outer-spin-button]:appearance-none",
          "[&::-webkit-inner-spin-button]:appearance-none",
          "dark:bg-gray-800 dark:border-gray-700",
          "dark:placeholder-gray-400",
          "mobile:text-base mobile:text-black dark:mobile:text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
