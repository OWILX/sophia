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

const DAILY_NEW_LIMIT = 25;

export async function getDailyNewBudget(userId) {
  const { data, error } = await client
    .from('user_daily_new_questions')
    .select('new_count')
    .eq('user_id', userId)
    .eq('for_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  const used = data?.new_count ?? 0;
  const remaining = Math.max(0, DAILY_NEW_LIMIT - used);

  return { ok: true, remaining, used };
}

export async function createQuiz(type, modules, num){
	const { data: { user } } = await client.auth.getUser();

  const params = validateQuizParams(user?.id, type, modules, num);

  if (!params.ok) {
    console.error('Validation failed:', params.errors);
    return { ok: false, error: params.errors};
  }
  const budget = await getDailyNewBudget(user.id);
  if (!budget.ok){
  	console.error(budget.error);
      return { ok: false, error: budget.error };
   }
  
	
}