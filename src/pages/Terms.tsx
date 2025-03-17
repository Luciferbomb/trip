import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const Terms = () => {
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
        <h1 className="text-xl font-semibold">Terms of Service</h1>
      </div>
      
      {/* Content */}
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Introduction</h2>
              <p className="text-gray-600 mb-2">
                Welcome to Hireyth. These Terms of Service govern your use of our website and services. By accessing or using Hireyth, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-600">
                Please read these Terms carefully before using our platform. If you do not agree with any part of these Terms, you may not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. Account Registration</h2>
              <p className="text-gray-600 mb-2">
                To use certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
              <p className="text-gray-600">
                You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. User Conduct</h2>
              <p className="text-gray-600 mb-2">
                You agree not to use Hireyth for any purpose that is unlawful or prohibited by these Terms. You may not use our platform in any manner that could damage, disable, overburden, or impair our services.
              </p>
              <p className="text-gray-600">
                You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
                <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
                <li>Interfere with or disrupt the services or servers or networks connected to the services</li>
                <li>Collect or store personal data about other users without their express consent</li>
                <li>Use the platform for commercial purposes without our prior written consent</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Trip Creation and Participation</h2>
              <p className="text-gray-600 mb-2">
                When creating or joining trips on Hireyth, you acknowledge that:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
                <li>Hireyth is a platform for connecting travelers and does not organize, operate, or lead trips itself</li>
                <li>You are responsible for your own safety and well-being during any trip</li>
                <li>You should exercise caution and good judgment when meeting other users in person</li>
                <li>You should verify the identity and reliability of other users before traveling with them</li>
                <li>Hireyth is not responsible for any disputes, injuries, losses, or damages that may occur during trips</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">5. Intellectual Property</h2>
              <p className="text-gray-600 mb-2">
                The content, organization, graphics, design, compilation, and other matters related to Hireyth are protected under applicable copyrights, trademarks, and other proprietary rights. Copying, redistributing, or using our content without permission is prohibited.
              </p>
              <p className="text-gray-600">
                By posting content on Hireyth, you grant us a non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout the world in any media.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">6. Limitation of Liability</h2>
              <p className="text-gray-600 mb-2">
                To the maximum extent permitted by law, Hireyth shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
              <p className="text-gray-600">
                In no event shall our aggregate liability exceed the amount you paid us, if any, in the past six months for the services giving rise to the claim.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">7. Modifications to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these Terms at any time. If we make changes, we will provide notice by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of Hireyth after such changes constitutes your acceptance of the new Terms.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Governing Law</h2>
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
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

export default Terms; 