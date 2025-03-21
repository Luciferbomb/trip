import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Compass, Map, User } from "lucide-react"

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const navItems: NavItem[] = [
    {
      icon: <Compass size={20} />,
      label: "Explore",
      path: "/explore",
    },
    {
      icon: <Map size={20} />,
      label: "Trips",
      path: "/trips",
    },
    {
      icon: <User size={20} />,
      label: "Profile",
      path: "/profile",
    },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 h-16 py-2 px-4 md:hidden",
        className
      )}
    >
      {/* Backdrop blur and border */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-sm -z-10" />
      
      {/* Navigation items */}
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full",
                "transition-all duration-300"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
              
              {/* Icon wrapper */}
              <div 
                className={cn(
                  "flex items-center justify-center",
                  isActive 
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {item.icon}
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  "text-xs mt-1",
                  isActive 
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                )}
              >
                {item.label}
              </span>
              
              {/* Glowing effect for active item */}
              {isActive && (
                <div className="absolute -inset-1 bg-blue-50 rounded-xl blur opacity-30" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Also export as default for compatibility
export default BottomNav
