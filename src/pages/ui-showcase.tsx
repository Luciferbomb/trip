import React from 'react'
import { CardShowcase } from '../components/ui/card-showcase'

export default function UIShowcasePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto py-12">
        <h1 className="mb-12 bg-gradient-to-r from-[#ff2975] to-[#00FFF1] bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl">
          Premium UI Components
        </h1>
        <CardShowcase />
      </div>
    </main>
  )
} 