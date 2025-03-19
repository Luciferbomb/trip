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
    creatorId: "user123",
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
    creatorName: "Mike T.",
    creatorId: "user456"
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
    creatorName: "Emma L.",
    creatorId: "user789"
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
    experienceType: "Sightseeing",
    likes: 245,
    comments: 32,
    liked: true
  },
  {
    id: "exp2",
    images: [
      "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579955330268-230203b36f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    ],
    caption: "Exploring Tokyo's vibrant street food scene in Shinjuku. The blend of flavors and aromas made for an unforgettable culinary adventure.",
    location: "Tokyo, Japan",
    date: "2023-06-15",
    userName: "Jamie Lee",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    experienceType: "Food",
    likes: 187,
    comments: 24
  },
  {
    id: "exp3",
    images: ["https://images.unsplash.com/photo-1682687980961-78fa83781777?q=80&w=1287&auto=format&fit=crop"],
    caption: "Hiking through the mountains in Switzerland was breathtaking. The crisp air and stunning views made every step worth it.",
    location: "Interlaken, Switzerland",
    date: "2023-08-05", 
    userName: "Chris Parker",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    experienceType: "Adventure",
    likes: 312,
    comments: 41
  },
  {
    id: "exp4",
    images: ["https://images.unsplash.com/photo-1583244532610-2a4438a941ea?q=80&w=1335&auto=format&fit=crop"],
    caption: "Spending the day at this hidden beach in Bali was perfect. Crystal clear water and not another tourist in sight!",
    location: "Bali, Indonesia",
    date: "2023-07-28",
    userName: "Sophia Chen",
    userImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    experienceType: "Beach",
    likes: 274,
    comments: 28
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
        <section className="py-20 bg-white">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Featured Trips</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join these popular trips created by our community members and start your next adventure.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTrips.map((trip) => (
                <TripCard 
                  key={trip.id}
                  {...trip}
                />
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link to="/trips" className="flex items-center justify-center gap-2">
                  Explore All Trips
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Recent Experiences Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Traveler Experiences</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Authentic moments shared by our community from their recent adventures around the world.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id}
                  {...experience}
                />
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link to="/experiences" className="flex items-center justify-center gap-2">
                  Explore All Experiences
                  <ArrowRight className="w-4 h-4" />
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
