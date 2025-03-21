import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Button } from '@/components/ui/button';
import { Globe, Users, Map, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <Hero />
      
      {/* Features section */}
      <Features />
      
      {/* How It Works Section */}
      <section className="py-16 bg-hireyth-lightest-blue">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              How Hireyth <span className="text-hireyth-main">Works</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to start your journey with like-minded travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Profile",
                description: "Sign up and create your traveler profile, highlighting your interests and travel style."
              },
              {
                step: "2",
                title: "Find or Create Trips",
                description: "Browse existing trips or create your own to share with the community."
              },
              {
                step: "3",
                title: "Connect and Travel",
                description: "Join trips, connect with travelers, and embark on unforgettable adventures together."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-xl shadow-md relative z-10">
                  <div className="bg-hireyth-main text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                  
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/3 -right-4 w-8 h-8 text-hireyth-main z-20">
                      <ArrowRight />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-hireyth-main text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Next Travel Companion?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join our community today and discover exciting trips and amazing people around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-hireyth-main hover:bg-gray-100"
                onClick={() => navigate('/signup')}
              >
                Sign Up Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-hireyth-dark"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center mb-2">
                <Globe className="h-5 w-5 text-hireyth-light mr-2" />
                <span className="text-xl font-bold text-white">Hireyth</span>
              </div>
              <p className="text-sm text-gray-400">
                Connecting travelers around the world for unforgettable adventures.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-white">Quick Links</h3>
                <ul className="space-y-1 text-sm">
                  <li><Link to="/login" className="hover:text-hireyth-light">Login</Link></li>
                  <li><Link to="/signup" className="hover:text-hireyth-light">Sign Up</Link></li>
                  <li><a href="#" className="hover:text-hireyth-light">How It Works</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">Resources</h3>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="hover:text-hireyth-light">Help Center</a></li>
                  <li><a href="#" className="hover:text-hireyth-light">Safety Tips</a></li>
                  <li><a href="#" className="hover:text-hireyth-light">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">Connect</h3>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="hover:text-hireyth-light">About Us</a></li>
                  <li><a href="#" className="hover:text-hireyth-light">Contact</a></li>
                  <li><a href="#" className="hover:text-hireyth-light">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Hireyth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 