import { supabase } from './supabase';
import { ensureChatAccess, sendChatMessage } from './dbFunctions';

/**
 * Test utility to verify chat messages are being saved to the database
 * @param tripId The ID of the trip
 * @param userId The ID of the user
 * @returns Promise with test results
 */
export const testChatMessageStorage = async (
  tripId: string,
  userId: string
): Promise<{
  success: boolean;
  chatExists: boolean;
  messageSent: boolean;
  messageVerified: boolean;
  chatId?: string;
  messageId?: string;
  error?: string;
}> => {
  console.log(`Running chat database test for trip ${tripId} and user ${userId}`);
  
  try {
    // Step 1: Ensure chat exists
    console.log('Step 1: Ensuring chat access...');
    const chatId = await ensureChatAccess(tripId, userId);
    
    if (!chatId) {
      return {
        success: false,
        chatExists: false,
        messageSent: false,
        messageVerified: false,
        error: 'Failed to create or find chat for trip'
      };
    }
    
    console.log(`Chat access ensured, chat ID: ${chatId}`);
    
    // Step 2: Send a test message
    console.log('Step 2: Sending test message...');
    const testMessage = `Test message - ${new Date().toISOString()}`;
    const sendResult = await sendChatMessage(chatId, userId, testMessage);
    
    if (!sendResult.success || !sendResult.messageId) {
      return {
        success: false,
        chatExists: true,
        chatId,
        messageSent: false,
        messageVerified: false,
        error: sendResult.error?.message || 'Failed to send test message'
      };
    }
    
    console.log(`Test message sent, message ID: ${sendResult.messageId}`);
    
    // Step 3: Verify message exists in database
    console.log('Step 3: Verifying message in database...');
    
    // Wait a short time to ensure the message is saved (for realtime subscriptions)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: messageData, error: messageError } = await supabase
      .from('trip_messages')
      .select('id, message')
      .eq('id', sendResult.messageId)
      .single();
      
    if (messageError || !messageData) {
      return {
        success: false,
        chatExists: true,
        chatId,
        messageSent: true,
        messageId: sendResult.messageId,
        messageVerified: false,
        error: messageError?.message || 'Message not found in database after sending'
      };
    }
    
    console.log(`Message verified in database: ${messageData.message}`);
    
    // Step 4: Verify chat room exists with correct trip_id
    const { data: chatData, error: chatError } = await supabase
      .from('trip_chats')
      .select('id, trip_id')
      .eq('id', chatId)
      .single();
      
    if (chatError || !chatData) {
      return {
        success: false,
        chatExists: true,
        chatId,
        messageSent: true,
        messageId: sendResult.messageId,
        messageVerified: true,
        error: chatError?.message || 'Chat not found in database during verification'
      };
    }
    
    if (chatData.trip_id !== tripId) {
      return {
        success: false,
        chatExists: true,
        chatId,
        messageSent: true,
        messageId: sendResult.messageId,
        messageVerified: true,
        error: `Chat trip_id mismatch. Expected: ${tripId}, Found: ${chatData.trip_id}`
      };
    }
    
    console.log('Chat verification complete - all steps passed');
    
    return {
      success: true,
      chatExists: true,
      chatId,
      messageSent: true,
      messageId: sendResult.messageId,
      messageVerified: true
    };
    
  } catch (error) {
    console.error('Unexpected error during chat test:', error);
    return {
      success: false,
      chatExists: false,
      messageSent: false,
      messageVerified: false,
      error: error instanceof Error ? error.message : 'Unknown error during chat test'
    };
  }
};

/**
 * Runs a chat test and displays the results
 * Use this in the browser console to test the chat functionality
 */
export const runChatTest = async (tripId: string, userId: string): Promise<void> => {
  console.log('=============================================');
  console.log('STARTING CHAT DATABASE TEST');
  console.log('=============================================');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Using Supabase');
  
  try {
    // First, verify the database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
      
    if (connectionError) {
      console.error('🚨 Database connection error:', connectionError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Replace the tables existence check
    console.log('📊 Checking tables existence...');
    let tablesExist = true;
    
    // Check if trip_chats table exists
    const { error: chatTableError } = await supabase
      .from('trip_chats')
      .select('id')
      .limit(1);
      
    const tripChatsExists = !chatTableError || !chatTableError.message.includes('does not exist');
    
    // Check if trip_messages table exists
    const { error: messagesTableError } = await supabase
      .from('trip_messages')
      .select('id')
      .limit(1);
      
    const tripMessagesExists = !messagesTableError || !messagesTableError.message.includes('does not exist');
    
    console.log('Tables check results:', { 
      trip_chats: tripChatsExists ? '✅ Exists' : '❌ Missing',
      trip_messages: tripMessagesExists ? '✅ Exists' : '❌ Missing',
      chat_error: chatTableError?.message,
      messages_error: messagesTableError?.message
    });
    
    if (!tripChatsExists || !tripMessagesExists) {
      console.error('🚨 Required tables are missing. Please run migrations.');
      console.log('Running migration to create tables...');
      
      try {
        // Try to import and run migrations
        const { runMigrations } = await import('./migrations');
        const result = await runMigrations(false);
        console.log('Migration result:', result ? '✅ Success' : '❌ Failed');
        
        // Check if tables exist after migration
        const { error: chatCheckError } = await supabase
          .from('trip_chats')
          .select('id')
          .limit(1);
          
        const { error: msgCheckError } = await supabase
          .from('trip_messages')
          .select('id')
          .limit(1);
          
        if (chatCheckError?.message.includes('does not exist') || 
            msgCheckError?.message.includes('does not exist')) {
          console.error('❌ Tables still missing after migration attempt');
          return;
        } else {
          console.log('✅ Tables successfully created');
        }
      } catch (migrationError) {
        console.error('Error running migrations:', migrationError);
        return;
      }
    }
    
    // Check approval-related tables
    console.log('📊 Checking approval-related tables...');

    // Check trips table
    const { error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .limit(1);
      
    const tripsExists = !tripsError || !tripsError.message?.includes('does not exist');
    console.log(`Trips table: ${tripsExists ? '✅ Exists' : '❌ Missing'}`);

    // Check trip_participants table
    const { error: participantsError } = await supabase
      .from('trip_participants')
      .select('id')
      .limit(1);
      
    const participantsExists = !participantsError || !participantsError.message?.includes('does not exist');
    console.log(`Trip participants table: ${participantsExists ? '✅ Exists' : '❌ Missing'}`);

    // Check users table
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    const usersExists = !usersError || !usersError.message?.includes('does not exist');
    console.log(`Users table: ${usersExists ? '✅ Exists' : '❌ Missing'}`);

    // Check if we need to run migrations
    if (!tripsExists || !participantsExists || !usersExists) {
      console.error('🚨 Some approval-related tables are missing. Please run migrations.');
      
      // Only proceed with the chat test if the basic tables exist
      if (!usersExists) {
        console.error('❌ Users table is missing - cannot proceed with chat test');
        return;
      }
    }
    
    // Now run the full test
    const result = await testChatMessageStorage(tripId, userId);
    
    console.log('=============================================');
    console.log('CHAT TEST RESULTS:');
    console.log('=============================================');
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Chat Exists: ${result.chatExists ? '✅' : '❌'}`);
    console.log(`Message Sent: ${result.messageSent ? '✅' : '❌'}`);
    console.log(`Message Verified: ${result.messageVerified ? '✅' : '❌'}`);
    
    if (result.chatId) console.log(`Chat ID: ${result.chatId}`);
    if (result.messageId) console.log(`Message ID: ${result.messageId}`);
    if (result.error) console.log(`Error: ${result.error}`);
    
    console.log('=============================================');
    
    // Additional diagnostics if test failed
    if (!result.success) {
      console.log('🔍 DIAGNOSTICS:');
      
      // Check trip existence
      if (!result.chatExists) {
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, creator_id')
          .eq('id', tripId)
          .single();
          
        if (tripError) {
          console.error('🚨 Trip not found:', tripError);
        } else {
          console.log('✅ Trip exists:', tripData);
          
          // Check if user is creator or participant
          const isCreator = tripData.creator_id === userId;
          console.log(`User is creator: ${isCreator ? '✅' : '❌'}`);
          
          if (!isCreator) {
            const { data: participantData, error: participantError } = await supabase
              .from('trip_participants')
              .select('status')
              .eq('trip_id', tripId)
              .eq('user_id', userId)
              .single();
              
            if (participantError) {
              console.error('🚨 User is not a participant:', participantError);
            } else {
              console.log(`User is a participant with status: ${participantData.status}`);
              if (participantData.status !== 'approved') {
                console.log('❌ User must be approved to access chat');
              }
            }
          }
        }
      }
      
      // Return instructions for fixing common issues
      console.log('TROUBLESHOOTING STEPS:');
      
      if (!result.chatExists) {
        console.log('- Check that trips table has the correct trip ID');
        console.log('- Verify user permissions (must be creator or approved participant)');
        console.log('- Check that trip_chats table exists in the database');
        console.log('- Examine RLS policies on trip_chats table');
      }
      
      if (result.chatExists && !result.messageSent) {
        console.log('- Check RLS policies on trip_messages table');
        console.log('- Verify user permissions for sending messages');
        console.log('- Check for constraints on the trip_messages table');
      }
      
      if (result.messageSent && !result.messageVerified) {
        console.log('- Check trigger functions on message insert');
        console.log('- Verify database connection stability');
        console.log('- Check for transaction rollbacks');
      }
      
      console.log('=============================================');
    }
  } catch (error) {
    console.error('Error running chat test:', error);
  }
}; 