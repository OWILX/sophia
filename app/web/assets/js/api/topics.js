// js/api/topics.js
import { client } from '../supabase.js';

export async function getAllTopics() {
  const { data, error } = await client
    .from('topics')
    .select('id, name')                    // id added for future-proofing (you can remove it if you never need it)
    .order('id', { ascending: true });

  if (error) {
    console.error('Failed to load courses:', error);
    throw error;
  }

  return data ?? [];
}