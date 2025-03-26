import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { HireythLogo } from "./HireythLogo"
import { HireythLogoAnimated } from "./HireythLogoAnimated"
import { TripIcon, ProfileTravelIcon } from "./TravelIcons"

interface NavItem {
  icon: React.ReactNode
  path: string
  isLogo?: boolean
}

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  // Check if a path is active
  const isPathActive = (path: string) => currentPath === path

  const navItems: NavItem[] = [
    {
      // Always show Trip icon as active for vibrant gradient
      icon: <TripIcon size={24} isActive={true} />,
      path: "/trips",
    },
    {
      icon: <HireythLogo size="xs" animate={true} />,
      path: "/explore",
      isLogo: true
    },
    {
      // Always show Profile icon as active for vibrant gradient
      icon: <ProfileTravelIcon size={24} isActive={true} />,
      path: "/profile",
    },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 h-14 py-2 px-4 md:hidden",
        className
      )}
    >
      {/* Backdrop blur and border */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-sm -z-10" />
      
      {/* Navigation items */}
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex items-center justify-center h-full",
                "w-14",
                "transition-all duration-300"
              )}
            >
              {/* Active indicator */}
              {isActive && !item.isLogo && (
                <div className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
              )}
              
              {/* Explore Logo Item (Special Case) */}
              {item.isLogo ? (
                <motion.div 
                  className="relative"
                  initial={false}
                  animate={isActive ? {
                    y: -4,
                    scale: 1.02,
                  } : {
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {isActive ? (
                    <div className="relative">
                      {/* Background glow effect */}
                      <motion.div 
                        className="absolute -inset-1 rounded-full bg-purple-500/15 blur-sm"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                        }}
                      />
                      <HireythLogoAnimated size="xs" animated={true} />
                    </div>
                  ) : (
                    <HireythLogo size="xs" animate={false} />
                  )}
                </motion.div>
              ) : (
                /* Regular Icon wrapper with enhanced colorful background */
                <motion.div 
                  className="relative flex items-center justify-center"
                  initial={false}
                  animate={isActive ? {
                    y: -1,
                    scale: 1.05,
                  } : {
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  {/* Enhanced colorful background - now always visible with stronger opacity */}
                  <motion.div 
                    className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 ${isActive ? 'opacity-25' : 'opacity-15'} blur-md`}
                    animate={isActive ? { 
                      scale: [1, 1.05, 1],
                      opacity: [0.25, 0.3, 0.25]
                    } : {}}
                    transition={{
                      repeat: isActive ? Infinity : 0,
                      duration: 2,
                    }}
                  />
                  {item.icon}
                </motion.div>
              )}
              
              {/* Enhanced glowing effect for active item */}
              {isActive && !item.isLogo && (
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-purple-500/25 to-blue-500/25 rounded-full blur-sm"
                  animate={{ 
                    opacity: [0.2, 0.3, 0.2],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                  }}
                />
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
