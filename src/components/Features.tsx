import React from 'react';
import { Users, Map, Sun, Shield, Clock, Heart } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-hireyth-main" />,
      title: "Find Like-minded Travelers",
      description: "Connect with people who share your travel interests, preferences, and destinations."
    },
    {
      icon: <Map className="h-6 w-6 text-hireyth-main" />,
      title: "Discover Unique Trips",
      description: "Browse through hundreds of community-created trips to find your next adventure."
    },
    {
      icon: <Sun className="h-6 w-6 text-hireyth-main" />,
      title: "Create Unforgettable Experiences",
      description: "Share your travel moments and create memorable experiences with new friends."
    },
    {
      icon: <Shield className="h-6 w-6 text-hireyth-main" />,
      title: "Traveler Verification",
      description: "Our verification process ensures you connect with genuine and trusted travelers."
    },
    {
      icon: <Clock className="h-6 w-6 text-hireyth-main" />,
      title: "Flexible Planning",
      description: "Join existing trips or create your own with flexible dates and customizable itineraries."
    },
    {
      icon: <Heart className="h-6 w-6 text-hireyth-main" />,
      title: "Community Support",
      description: "Get advice, recommendations, and support from our global community of travelers."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Why Choose <span className="text-hireyth-main">Hireyth</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how our platform makes travel more accessible, enjoyable, and memorable through community connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="bg-hireyth-lightest-blue w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
