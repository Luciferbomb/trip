import React from 'react';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { ChatInput } from '@/components/ui/chat-input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
        <Card>
          <CardHeader>
            <CardTitle>Chat Interface Demo</CardTitle>
            <CardDescription>
              This demonstrates our production chat UI components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="h-[400px] bg-gray-50">
                <ChatMessageList>
                  <div className="p-4 bg-blue-100 rounded-lg mb-2 max-w-[80%]">
                    <p className="text-sm text-gray-800">Hello! This is a demo message.</p>
                    <span className="text-xs text-gray-500 mt-1 block">Demo User • Just now</span>
                  </div>
                </ChatMessageList>
              </div>
              <div className="p-4 border-t bg-white">
                <ChatInput 
                  placeholder="Type a message..."
                  onValueChange={(message) => console.log('Message sent:', message)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatDemo; 