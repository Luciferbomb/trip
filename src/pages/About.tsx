import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />
      
      {/* Sub Header */}
      <div className="bg-white p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">About Hireyth</h1>
      </div>
      
      {/* Content */}
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600">
              At Hireyth, we believe that travel is better when shared. Our mission is to connect like-minded travelers who want to explore the world together, creating meaningful experiences and lasting friendships along the way.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Hireyth was founded in 2023 by a group of passionate travelers who recognized a gap in the market: while there were plenty of platforms for booking trips, there weren't many dedicated to connecting solo travelers who wanted to share experiences.
            </p>
            <p className="text-gray-600">
              What started as a simple idea has grown into a vibrant community of explorers from all walks of life, united by their love for adventure and new connections.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-hireyth-main rounded-full flex items-center justify-center text-white font-bold mb-4">1</div>
                <h3 className="text-lg font-semibold mb-2">Create a Profile</h3>
                <p className="text-gray-600">Sign up and tell us about yourself, your travel preferences, and what you're looking for in travel companions.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-hireyth-main rounded-full flex items-center justify-center text-white font-bold mb-4">2</div>
                <h3 className="text-lg font-semibold mb-2">Discover Trips</h3>
                <p className="text-gray-600">Browse trips created by other travelers or create your own adventure and invite others to join.</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-hireyth-main rounded-full flex items-center justify-center text-white font-bold mb-4">3</div>
                <h3 className="text-lg font-semibold mb-2">Connect & Travel</h3>
                <p className="text-gray-600">Chat with potential travel buddies, finalize plans, and embark on unforgettable journeys together.</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Values</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><span className="font-semibold">Safety:</span> We prioritize the safety of our community through verification processes and safety guidelines.</li>
              <li><span className="font-semibold">Inclusivity:</span> We welcome travelers of all backgrounds, beliefs, and identities.</li>
              <li><span className="font-semibold">Authenticity:</span> We encourage genuine connections and authentic travel experiences.</li>
              <li><span className="font-semibold">Sustainability:</span> We promote responsible travel practices that respect local communities and the environment.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Our Community</h2>
            <p className="text-gray-600 mb-4">
              Whether you're a seasoned globetrotter or planning your first big adventure, Hireyth is the perfect platform to find companions who share your travel vision.
            </p>
            <div className="flex justify-center">
              <Button className="bg-hireyth-main hover:bg-hireyth-main/90" onClick={() => navigate('/signup')}>
                Sign Up Now
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About; 