// js/api/modules.js
import { client } from '../supabase.js';

export async function getModules(coName) {
  if (!courseName?.trim()) {
    return [];
  }
  const { data, error } = await supabase
  .from('topics')
  .select(`
    name,
    courses!inner(name)
  `)
  .eq('courses.name', courseName)
  .order('id', { ascending: true });
  if (error) {
    console.error('Failed to load topics:', error);
    throw error;
  }
  return data ?? [];
}