import * as React from "react"
import { cn } from "@/lib/utils"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"

interface Testimonial {
  id: string | number
  name: string
  image: string
  rating: number
  location: string
  tripName?: string
  testimonial: string
}

interface TravelTestimonialsProps {
  testimonials: Testimonial[]
  className?: string
}

export function TravelTestimonials({
  testimonials,
  className,
}: TravelTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    )
  }

  if (!testimonials.length) return null

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className={cn("relative w-full py-8", className)}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/20 to-purple-500/20 opacity-30 blur-3xl" />
      
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">What Our Travelers Say</h2>
          <p className="text-white/70">Real experiences from our global community</p>
        </div>
        
        <div className="relative mx-auto max-w-4xl">
          {/* Glassmorphism Card */}
          <div className="glassmorphism-card rounded-xl p-8 md:p-12 border border-white/20 backdrop-blur-lg">
            {/* Quote Icon */}
            <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <Quote className="h-5 w-5 text-white/80" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* User Image */}
              <div className="relative min-w-[120px]">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20">
                  <img 
                    src={currentTestimonial.image}
                    alt={currentTestimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Stars */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 border border-white/20">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < currentTestimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-white/30"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <blockquote className="text-white/90 text-lg italic mb-6">
                  "{currentTestimonial.testimonial}"
                </blockquote>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-white font-medium text-lg">{currentTestimonial.name}</h4>
                    <p className="text-white/70 text-sm flex items-center gap-1">
                      <span>{currentTestimonial.location}</span>
                      {currentTestimonial.tripName && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{currentTestimonial.tripName}</span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prevTestimonial}
                      className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 transition-colors"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 transition-colors"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 