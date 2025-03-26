import React from 'react'
import { PremiumCard } from './premium-card'

export const CardShowcase = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Default Card */}
        <PremiumCard className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Default Card</h3>
          <p className="text-gray-600">
            A simple, elegant card with subtle transparency and border effects.
          </p>
        </PremiumCard>

        {/* Gradient Card */}
        <PremiumCard variant="gradient" className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Gradient Card</h3>
          <p className="text-gray-600">
            Features a beautiful gradient background with blur effects.
          </p>
        </PremiumCard>

        {/* Glass Card */}
        <PremiumCard variant="glass" className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Glass Card</h3>
          <p className="text-gray-600">
            Glass morphism effect with backdrop blur and subtle shadows.
          </p>
        </PremiumCard>

        {/* Neon Card */}
        <PremiumCard variant="neon" className="space-y-4" glowColor="#00fff1">
          <h3 className="text-2xl font-bold text-gray-900">Neon Card</h3>
          <p className="text-gray-600">
            Eye-catching neon glow effect with customizable colors.
          </p>
        </PremiumCard>
      </div>
    </div>
  )
} 