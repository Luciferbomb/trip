import React, { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const ExperiencesLayout: React.FC<LayoutProps> = ({ children }) => {
  useEffect(() => {
    // Update document title
    document.title = 'Experiences | Hireyth Network';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Share and explore travel experiences');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Share and explore travel experiences';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        {/* No Footer here */}
      </div>
    </>
  );
};

export default ExperiencesLayout; 