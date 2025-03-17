
import React, { useRef, useEffect } from 'react';
import { ArrowRight, Users, Globe, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      
      const { clientX, clientY } = e;
      const rect = heroRef.current.getBoundingClientRect();
      
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      
      const moveX = 30 * (x - 0.5);
      const moveY = 30 * (y - 0.5);
      
      const imgElements = heroRef.current.querySelectorAll('.parallax-img');
      imgElements.forEach((img, index) => {
        const factor = (index + 1) * 0.2;
        (img as HTMLElement).style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-white to-hireyth-lightest-blue opacity-70"></div>
        
        {/* Parallax Images */}
        <div className="parallax-img absolute -top-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-hireyth-lightest-blue opacity-50 blur-3xl transition-transform duration-700 ease-apple"></div>
        <div className="parallax-img absolute -bottom-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-hireyth-lightest-orange opacity-40 blur-3xl transition-transform duration-700 ease-apple"></div>
        <div className="parallax-img absolute top-[30%] right-[10%] w-[25%] h-[25%] rounded-full bg-hireyth-blue/10 blur-2xl transition-transform duration-700 ease-apple"></div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Text */}
          <div className="text-center lg:text-left animate-slide-up lg:order-1 order-2">
            <div className="inline-flex items-center px-3 py-1 space-x-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-hireyth-orange"></span>
              <span className="text-sm font-medium text-gray-600">Connecting travelers worldwide</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 hero-text-shadow tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-hireyth-blue to-hireyth-blue">Find Your </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-hireyth-orange to-hireyth-orange">Travel Partner</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Connect with like-minded travelers, discover new destinations, and share unforgettable experiences around the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-gradient-to-r from-hireyth-blue to-hireyth-light-blue hover:opacity-90 text-white">
                <Link to="/trips" className="group">
                  Find a Trip
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="border-gray-200 hover:bg-gray-50">
                <Link to="/experiences">
                  Explore Experiences
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto lg:mx-0">
              {[
                { icon: <Users className="w-5 h-5 text-hireyth-blue" />, value: "10K+", label: "Travelers" },
                { icon: <Globe className="w-5 h-5 text-hireyth-orange" />, value: "120+", label: "Countries" },
                { icon: <Map className="w-5 h-5 text-hireyth-blue" />, value: "5K+", label: "Trips" }
              ].map((stat, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                    {stat.icon}
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="relative lg:order-2 order-1 mx-auto lg:mx-0 w-full max-w-md lg:max-w-none">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl card-shadow">
              <div className="absolute inset-0 bg-gradient-to-tr from-hireyth-blue/20 to-transparent"></div>
              <img 
                src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Travelers exploring together" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Accent Elements */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl glass-card p-4 shadow-lg overflow-hidden animate-float">
              <img 
                src="https://images.unsplash.com/photo-1465310477141-6fb93167a273?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Beach scene" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full glass-card p-2 shadow-lg overflow-hidden animate-float animation-delay-1000">
              <img 
                src="https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Mountain scene" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
