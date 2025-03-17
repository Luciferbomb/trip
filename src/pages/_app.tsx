import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { setupDatabase } from '@/lib/supabase-setup';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize the database on app startup
    const initDb = async () => {
      try {
        console.log('Initializing database on app startup...');
        await setupDatabase();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    initDb();
  }, []);
  
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
} 