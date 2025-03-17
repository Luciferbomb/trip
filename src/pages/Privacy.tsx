import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const Privacy = () => {
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
        <h1 className="text-xl font-semibold">Privacy Policy</h1>
      </div>
      
      {/* Content */}
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Introduction</h2>
              <p className="text-gray-600">
                At Hireyth, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 mb-2">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Register for an account</li>
                <li>Create or edit your user profile</li>
                <li>Create or join trips</li>
                <li>Communicate with other users</li>
                <li>Contact our customer support</li>
                <li>Respond to surveys or promotions</li>
              </ul>
              <p className="text-gray-600 mt-3 mb-2">
                This information may include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Personal identifiers (name, email address, phone number)</li>
                <li>Profile information (profile picture, bio, location)</li>
                <li>Travel preferences and interests</li>
                <li>Communications and interactions with other users</li>
                <li>Payment information (when applicable)</li>
              </ul>
              <p className="text-gray-600 mt-3">
                We also automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, access times, and pages viewed.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Process transactions and send related information</li>
                <li>Connect you with other travelers</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Personalize your experience and deliver content relevant to your interests</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Sharing of Information</h2>
              <p className="text-gray-600 mb-2">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>With other users as part of the normal operation of the service (e.g., when you create or join trips)</li>
                <li>With service providers, consultants, and other third parties who perform services on our behalf</li>
                <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process</li>
                <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of Hireyth or others</li>
                <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
                <li>With your consent or at your direction</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">5. Data Security</h2>
              <p className="text-gray-600">
                We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet or electronic communications service is ever completely secure, so we encourage you to take care when disclosing personal information online.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">6. Your Choices</h2>
              <p className="text-gray-600 mb-2">
                You have several choices regarding the information we collect and how it's used:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Account Information: You may update, correct, or delete your account information at any time by logging into your account settings</li>
                <li>Cookies: Most web browsers are set to accept cookies by default. You can usually choose to set your browser to remove or reject browser cookies</li>
                <li>Promotional Communications: You may opt out of receiving promotional emails from Hireyth by following the instructions in those emails</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">7. Children's Privacy</h2>
              <p className="text-gray-600">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information from a child under 18, we will delete that information.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Changes to this Privacy Policy</h2>
              <p className="text-gray-600">
                We may update this privacy policy from time to time. If we make material changes, we will notify you by email or through a notice on our website prior to the change becoming effective. We encourage you to review the privacy policy whenever you access our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">9. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@hireyth.com.
              </p>
            </section>
            
            <div className="mt-8 text-sm text-gray-500 text-center">
              <p>Last Updated: November 1, 2023</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy; 