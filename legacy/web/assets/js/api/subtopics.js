// js/api/subtopics.js
import { client } from '../supabase.js';

export async function getSubtopics (topicName) {
  if (!topicName?.trim()) {
    return [];
  }
  const { data, error } = await client
  .from('subtopics')
  .select(`
    name,
    topics!inner(name)
  `)
  .eq('topics.name', topicName)
  .order('id', { ascending: true });
  if (error) {
    console.error('Failed to load subtopics:', error);
    throw error;
  }
  return data ?? [];
}