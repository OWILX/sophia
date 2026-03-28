import { client } from '../supabase.js';

const VALID_QUIZ_TYPES = {
  mcq:    ['mcq'],
  tf:     ['tf'],
  mcq_tf: ['mcq', 'tf'],
};

function validateQuizParams(userId, type, modules, num) {
  const errors = [];

  if (!userId)
    errors.push('Not logged in');

  if (!Array.isArray(modules) || modules.length === 0)
    errors.push('No modules selected');

  if (!Number.isInteger(num) || num <= 0)
    errors.push('Invalid quiz length');

  if (!VALID_QUIZ_TYPES[type])
    errors.push('Invalid quiz type');

  return {
    ok:     errors.length === 0,
    errors,
    allowedTypes: VALID_QUIZ_TYPES[type] ?? null,
  };
}
export async function createQuiz(){
	const { data: { user } } = await client.auth.getUser();

  const { ok, errors, allowedTypes } = validateQuizParams(user?.id, type, modules, num);

  if (!ok) {
    console.error('Validation failed:', errors);
    return { ok: false, errors };
  }
	
}