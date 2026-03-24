// js/api/topics.js
import { client } from '../supabase.js';

export async function getTopics(courseName) {
  if (!courseName?.trim()) {
    return [];
  }
  const { data, error } = await client
    .from('topics')
    .select('name')
    .eq('course_id', 
        // We need the actual course.id, not the name
        // So we first get the id from courses table
        (await client
          .from('courses')
          .select('id')
          .eq('name', courseName)
          .single()
        ).data?.id
      )
    .order('id', { ascending: true });
  if (error) {
    console.error('Failed to load topics:', error);
    throw error;
  }
  return data ?? [];
}