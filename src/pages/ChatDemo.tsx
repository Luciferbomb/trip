import React from 'react';
import { ChatMessageListDemo } from '@/components/ChatMessageListDemo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ChatDemo = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat Components Demo</h1>
        <Button asChild variant="outline">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
      
      <div className="grid gap-8 max-w-4xl mx-auto">
        <div className="p-6 border rounded-xl bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Chat Message List Demo</h2>
          <p className="text-gray-500 mb-6">
            This demonstrates the enhanced chat UI components we've implemented.
          </p>
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <ChatMessageListDemo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo; 