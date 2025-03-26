import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import Chat from '@/components/Chat';

interface TripDiscussionProps {
  tripId: string;
  tripName?: string;
  isCreator: boolean;
  isApproved: boolean;
}

const TripDiscussion: React.FC<TripDiscussionProps> = ({
  tripId,
  tripName,
  isCreator,
  isApproved
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You need to be logged in to view the discussion.
        </AlertDescription>
      </Alert>
    );
  }

  // Only approved participants and the creator can view the discussion
  if (!isApproved && !isCreator) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pending Approval</AlertTitle>
        <AlertDescription>
          You can participate in the discussion once your request to join is approved.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-hidden">
      <Chat tripId={tripId} tripName={tripName} />
    </div>
  );
};

export default TripDiscussion; 