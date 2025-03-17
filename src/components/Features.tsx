
import React from 'react';
import { Users, Map, MessageCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Connect with Fellow Travelers",
    description: "Build your profile and connect with like-minded travelers from around the world. Find your perfect travel companion based on shared interests and destinations.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: "Discover & Join Trips",
    description: "Browse open trips or create your own adventure. Specify destinations, dates, and available spots for others to join your journey.",
    color: "from-orange-500 to-amber-400"
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Stay Connected",
    description: "Chat privately with potential travel partners, ask questions in comments, and coordinate through group chats for each trip.",
    color: "from-green-500 to-emerald-400"
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Verified Profiles",
    description: "Travel with confidence knowing that all users are verified through social profile linking for enhanced security and trust.",
    color: "from-purple-500 to-violet-400"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">How Hireyth Works</h2>
          <p className="text-lg text-gray-600">
            A simple platform designed to help you connect, explore, and create memorable travel experiences.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl subtle-shadow border border-gray-100 p-8 hover-scale"
            >
              <div className={cn(
                "w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br",
                feature.color
              )}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
