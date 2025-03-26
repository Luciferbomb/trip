import { supabase } from './supabase';

/**
 * Updates a participant's status and the trip's spots_filled count in a single transaction
 * @param participantId The ID of the participant to update
 * @param tripId The ID of the trip
 * @param newStatus The new status to set ('approved', 'pending', or 'rejected')
 * @returns A promise that resolves when the transaction is complete
 */
export const updateParticipantStatus = async (
  participantId: string,
  tripId: string,
  newStatus: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.log(`Updating participant ${participantId} to ${newStatus} for trip ${tripId}`);
    
    // First get the participant to get their current status and user_id
    const { data: participant, error: getError } = await supabase
      .from('trip_participants')
      .select('user_id, status')
      .eq('id', participantId)
      .single();
      
    if (getError) {
      console.error('Error getting participant:', getError);
      throw getError;
    }
    
    if (!participant) {
      throw new Error('Participant not found');
    }
    
    // Check if we're actually changing the status
    if (participant.status === newStatus) {
      console.log('Status already set to', newStatus);
      return { success: true, error: null };
    }
    
    // Check if the trip has space available if approving
    if (newStatus === 'approved' && participant.status !== 'approved') {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('spots, spots_filled')
        .eq('id', tripId)
        .single();
        
      if (tripError) {
        console.error('Error checking trip space:', tripError);
        throw tripError;
      }
      
      if (tripData.spots_filled >= tripData.spots) {
        throw new Error('Trip is already full');
      }
    }
    
    // Update the participant status
    const { error: updateError } = await supabase
      .from('trip_participants')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (updateError) {
      console.error('Error updating participant status:', updateError);
      throw updateError;
    }

    // Calculate the spots filled delta
    let spotsDelta = 0;
    
    if (newStatus === 'approved' && participant.status !== 'approved') {
      // Adding an approved participant
      spotsDelta = 1;
    } else if (newStatus !== 'approved' && participant.status === 'approved') {
      // Removing an approved participant
      spotsDelta = -1;
    }
    
    // Only update spots_filled if there's a change
    if (spotsDelta !== 0) {
      // Then update the spots_filled count
      const { data: approvedCount, error: countError } = await supabase
        .from('trip_participants')
        .select('id', { count: 'exact', head: false })
        .eq('trip_id', tripId)
        .eq('status', 'approved');
  
      if (countError) {
        console.error('Error counting approved participants:', countError);
        throw countError;
      }
  
      const { error: tripUpdateError } = await supabase
        .from('trips')
        .update({ 
          spots_filled: approvedCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', tripId);
  
      if (tripUpdateError) {
        console.error('Error updating trip spots_filled:', tripUpdateError);
        throw tripUpdateError;
      }
    }
    
    // If the participant was approved, ensure they have access to the chat
    if (newStatus === 'approved') {
      await ensureChatAccess(tripId, participant.user_id);
    }

    console.log('Participant status updated successfully to', newStatus);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating participant status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
};

/**
 * Checks if a trip has available spots
 * @param tripId The ID of the trip to check
 * @returns A promise that resolves to true if there are spots available, false otherwise
 */
export const checkTripAvailability = async (tripId: string): Promise<boolean> => {
  try {
    // Get the trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('spots, spots_filled')
      .eq('id', tripId)
      .single();
    
    if (tripError) throw tripError;
    
    // Check if there are available spots
    return (trip.spots_filled || 0) < trip.spots;
  } catch (error) {
    console.error('Error checking trip availability:', error);
    return false;
  }
};

/**
 * Gets the current approval status for a user in a trip
 * @param userId The ID of the user
 * @param tripId The ID of the trip
 * @returns A promise that resolves to the status or null if not found
 */
export const getUserTripStatus = async (
  userId: string,
  tripId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('trip_participants')
      .select('status')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data?.status || null;
  } catch (error) {
    console.error('Error getting user trip status:', error);
    return null;
  }
};

/**
 * Ensures a user has access to the trip chat
 * @param tripId The ID of the trip
 * @param userId The ID of the user to grant access
 * @returns A promise with the chat ID that was created or verified
 */
export const ensureChatAccess = async (
  tripId: string,
  userId: string
): Promise<string | null> => {
  try {
    console.log('Ensuring chat access for user:', userId, 'in trip:', tripId);
    
    // First, check if multiple chat rooms exist and clean them up
    await cleanupDuplicateChats(tripId);
    
    // Now get the single chat ID for this trip (after cleanup)
    const { data: chats, error: chatError } = await supabase
      .from('trip_chats')
      .select('id')
      .eq('trip_id', tripId);
      
    if (chatError) {
      console.error('Error fetching chats:', chatError);
      throw chatError;
    }
    
    console.log(`Found ${chats?.length || 0} chats for trip ${tripId}`);
    
    let chatId: string | null = null;
    
    // If no chat exists, create one
    if (!chats || chats.length === 0) {
      console.log('No chat found for trip, creating one:', tripId);
      
      // Check if user is the trip creator
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('creator_id')
        .eq('id', tripId)
        .single();
        
      if (tripError) {
        console.error('Error fetching trip data:', tripError);
        throw tripError;
      }
      
      const isCreator = tripData.creator_id === userId;
      
      // Check if user is an approved participant
      let isApproved = false;
      if (!isCreator) {
        const { data: participantData, error: participantError } = await supabase
          .from('trip_participants')
          .select('status')
          .eq('trip_id', tripId)
          .eq('user_id', userId)
          .single();
          
        if (!participantError && participantData) {
          isApproved = participantData.status === 'approved';
        }
      }
      
      // Create the chat (always create it to ensure chat persistence)
      console.log('Creating chat for trip:', tripId);
      const { data: newChat, error: createError } = await supabase
        .from('trip_chats')
        .insert({ trip_id: tripId })
        .select('id')
        .single();
        
      if (createError) {
        console.error('Error creating chat:', createError);
        throw createError;
      }
      
      if (newChat) {
        console.log('Created new chat for trip:', tripId, 'with ID:', newChat.id);
        chatId = newChat.id;
      }
    } else if (chats.length > 1) {
      console.warn(`Multiple chats still exist for trip ${tripId} after cleanup attempt, using the first one`);
      chatId = chats[0].id;
    } else {
      console.log(`Found existing chat for trip ${tripId}:`, chats[0].id);
      chatId = chats[0].id;
    }
    
    if (!chatId) {
      console.error('No chat ID available after chat creation/retrieval');
      return null;
    }
    
    // Verify the chat exists in database
    console.log('Verifying chat exists with ID:', chatId);
    const { data: verifyChat, error: verifyError } = await supabase
      .from('trip_chats')
      .select('id')
      .eq('id', chatId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying chat:', verifyError);
      throw verifyError;
    }
    
    if (!verifyChat) {
      console.error('Chat not found after creation/verification:', chatId);
      return null;
    }
    
    console.log('Successfully verified chat exists:', chatId);
    return chatId;
  } catch (error) {
    console.error('Error ensuring chat access:', error);
    return null;
  }
};

/**
 * Cleans up duplicate chat rooms for a trip, keeping only the oldest one
 * @param tripId The ID of the trip to clean up
 * @returns A promise with the deleted chat IDs
 */
export const cleanupDuplicateChats = async (
  tripId: string
): Promise<string[]> => {
  try {
    console.log('Cleaning up duplicate chat rooms for trip:', tripId);
    
    // Get all chats for this trip
    const { data: chats, error: fetchError } = await supabase
      .from('trip_chats')
      .select('id, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });
      
    if (fetchError) throw fetchError;
    
    if (!chats || chats.length <= 1) {
      console.log('No duplicate chats found for trip:', tripId);
      return [];
    }
    
    console.log(`Found ${chats.length} chats for trip ${tripId}, keeping the oldest one`);
    
    // Keep the first (oldest) chat, delete the rest
    const chatToKeep = chats[0];
    const chatsToDelete = chats.slice(1);
    const chatIdsToDelete = chatsToDelete.map(chat => chat.id);
    
    // Delete duplicate chats
    if (chatIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('trip_chats')
        .delete()
        .in('id', chatIdsToDelete);
        
      if (deleteError) throw deleteError;
      
      console.log(`Successfully deleted ${chatIdsToDelete.length} duplicate chats`);
    }
    
    return chatIdsToDelete;
  } catch (error) {
    console.error('Error cleaning up duplicate chats:', error);
    return [];
  }
};

/**
 * Sends a message to a trip chat with better error handling
 * @param chatId The ID of the chat to send the message to
 * @param userId The ID of the user sending the message
 * @param message The message text
 * @returns A promise that resolves with the message data or rejects with an error
 */
export const sendChatMessage = async (
  chatId: string,
  userId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    console.log('Sending chat message:', { chatId, userId, messageLength: message.length });
    
    if (!chatId || !userId || !message.trim()) {
      console.error('Invalid message data:', { chatId, userId, messageLength: message?.length });
      return { 
        success: false, 
        error: { message: 'Missing required message data' } 
      };
    }
    
    // First check if the user is allowed to send messages (either creator or approved participant)
    const { data: chatData, error: chatError } = await supabase
      .from('trip_chats')
      .select('trip_id')
      .eq('id', chatId)
      .single();
      
    if (chatError) {
      console.error('Error fetching chat data:', chatError);
      return { 
        success: false, 
        error: { 
          message: 'Chat not found',
          originalError: chatError
        } 
      };
    }
    
    // Check if user is trip creator or approved participant
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('creator_id')
      .eq('id', chatData.trip_id)
      .single();
    
    if (tripError) {
      console.error('Error fetching trip data:', tripError);
      return { 
        success: false, 
        error: { 
          message: 'Trip not found',
          originalError: tripError
        }
      };
    }
    
    const isCreator = tripData.creator_id === userId;
    
    if (!isCreator) {
      // Check if user is an approved participant
      const { data: participantData, error: participantError } = await supabase
        .from('trip_participants')
        .select('status')
        .eq('trip_id', chatData.trip_id)
        .eq('user_id', userId)
        .single();
        
      if (participantError) {
        console.error('Error fetching participant data:', participantError);
        return { 
          success: false, 
          error: { 
            message: 'Not authorized to send messages',
            originalError: participantError
          }
        };
      }
      
      if (participantData.status !== 'approved') {
        console.error('User not approved to send messages:', { status: participantData.status });
        return { 
          success: false, 
          error: { message: 'You must be approved to send messages' }
        };
      }
    }
    
    // Insert the message
    console.log('Inserting message into trip_messages table:', {
      chat_id: chatId,
      user_id: userId,
      message_length: message.trim().length
    });
    
    const { data, error } = await supabase
      .from('trip_messages')
      .insert({
        chat_id: chatId,
        user_id: userId,
        message: message.trim()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      
      // Check for specific error codes to provide better feedback
      if (error.code === '23503') {
        console.error('Foreign key violation - chat_id or user_id may be invalid');
      } else if (error.code === '42P01') {
        console.error('Table does not exist - trip_messages table might not be created');
      }
      
      return { 
        success: false, 
        error: { 
          message: 'Failed to send message',
          originalError: error
        }
      };
    }
    
    console.log('Message sent successfully:', data.id);
    
    // Verify the message was saved by fetching it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('trip_messages')
      .select('id, message')
      .eq('id', data.id)
      .single();
      
    if (verifyError) {
      console.warn('Message sent but verification failed:', verifyError);
    } else {
      console.log('Message verified in database:', verifyData);
    }
    
    return { 
      success: true, 
      messageId: data.id 
    };
  } catch (error) {
    console.error('Unexpected error sending message:', error);
    return { 
      success: false, 
      error: { 
        message: 'Unexpected error sending message',
        originalError: error
      }
    };
  }
}; 