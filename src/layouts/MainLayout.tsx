import React, { ReactNode } from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 pb-24">
        {children}
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default MainLayout; 