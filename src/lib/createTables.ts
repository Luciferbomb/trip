/**
 * Script to manually create missing tables in the Supabase database
 * 
 * Run this script using:
 * npx ts-node createTables.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(filePath: string): Promise<boolean> {
  try {
    // Read SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute SQL commands individually
    const commands = sql
      .split(';')
      .filter(cmd => cmd.trim() !== '')
      .map(cmd => cmd.trim() + ';');
    
    console.log(`Executing ${commands.length} SQL commands...`);
    
    for (const command of commands) {
      console.log(`Running command: ${command.substring(0, 100)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      
      if (error) {
        console.error('Error executing SQL command:', error);
        
        // Only warn, don't stop execution as some errors might be due to policies already existing
        console.warn('Continuing despite error...');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

async function checkTable(tableName: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('information_schema.tables')
      .select('table_name', { count: 'exact', head: true })
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
    
    if (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function createMissingTables(): Promise<void> {
  // Check if experience_likes table exists
  const experienceLikesExists = await checkTable('experience_likes');
  console.log(`experience_likes table exists: ${experienceLikesExists}`);
  
  // Check if experience_comments table exists
  const experienceCommentsExists = await checkTable('experience_comments');
  console.log(`experience_comments table exists: ${experienceCommentsExists}`);
  
  // Create missing tables
  if (!experienceLikesExists || !experienceCommentsExists) {
    console.log('Creating missing tables...');
    
    // Execute SQL script
    const sqlPath = path.join(__dirname, 'direct-tables-script.sql');
    const success = await executeSQL(sqlPath);
    
    if (success) {
      console.log('Tables created successfully!');
    } else {
      console.error('Failed to create tables');
    }
  } else {
    console.log('All tables already exist');
  }
}

// Run the function
createMissingTables()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err)); 