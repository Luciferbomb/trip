
import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import TripCard from '@/components/TripCard';
import ExperienceCard from '@/components/ExperienceCard';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Sample data
const featuredTrips = [
  {
    id: "trip1",
    title: "Exploring the Greek Islands",
    location: "Santorini, Greece",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-08-15",
    endDate: "2023-08-25",
    spots: 3,
    creatorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Sarah J.",
    featured: true
  },
  {
    id: "trip2",
    title: "Japanese Culture Tour",
    location: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-09-10",
    endDate: "2023-09-22",
    spots: 2,
    creatorImage: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Mike T."
  },
  {
    id: "trip3",
    title: "Northern Lights Adventure",
    location: "Tromsø, Norway",
    image: "https://images.unsplash.com/photo-1483127140521-b816a161ae22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-11-05",
    endDate: "2023-11-12",
    spots: 4,
    creatorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Emma L."
  }
];

const recentExperiences = [
  {
    id: "exp1",
    images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"],
    caption: "Watching the sunset from Oia Castle was absolutely magical. The colors reflecting off the white buildings created a scene I'll never forget.",
    location: "Santorini, Greece",
    date: "2023-07-20",
    userName: "Alex Morgan",
    userImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    likes: 245,
    comments: 32,
    liked: true
  },
  {
    id: "exp2",
    images: [
      "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1523906921802-b5d2d899e93b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"
    ],
    caption: "Tokyo at night is like stepping into another world. The neon lights, the bustling streets, and the incredible food scene make it a must-visit!",
    location: "Tokyo, Japan",
    date: "2023-06-15",
    userName: "Jade Kim",
    userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    likes: 189,
    comments: 27
  }
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <Features />
        
        {/* Featured Trips Section */}
        <section className="py-20 bg-hireyth-lightest-blue">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Featured Trips</h2>
                <p className="text-gray-600 max-w-2xl">
                  Discover exciting trips created by our community members looking for travel companions.
                </p>
              </div>
              
              <Button asChild variant="outline" className="hidden md:flex">
                <Link to="/trips" className="flex items-center">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTrips.map((trip) => (
                <TripCard 
                  key={trip.id}
                  {...trip}
                />
              ))}
            </div>
            
            <div className="mt-10 text-center md:hidden">
              <Button asChild variant="outline">
                <Link to="/trips" className="flex items-center justify-center">
                  View All Trips
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Recent Experiences Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Recent Experiences</h2>
                <p className="text-gray-600 max-w-2xl">
                  See what other travelers are sharing from their recent adventures.
                </p>
              </div>
              
              <Button asChild variant="outline" className="hidden md:flex">
                <Link to="/experiences" className="flex items-center">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id}
                  {...experience}
                />
              ))}
            </div>
            
            <div className="mt-10 text-center md:hidden">
              <Button asChild variant="outline">
                <Link to="/experiences" className="flex items-center justify-center">
                  View All Experiences
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
