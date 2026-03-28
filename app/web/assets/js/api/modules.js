// js/api/modules.js
import { client } from '../supabase.js';

export async function getModules(subtopicName) {
  if (!subtopicName?.trim()) {
    return [];
  }
  const { data, error } = await client
  .from('modules')
  .select(`
    id,name,
    subtopics!inner(name)
  `)
  .eq('subtopics.name', subtopicName)
  .order('id', { ascending: true });
  if (error) {
    console.error('Failed to load modules:', error);
    throw error;
  }
  return data ?? [];
}