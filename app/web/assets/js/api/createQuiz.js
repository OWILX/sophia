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

async function getDailyNewBudget(userId) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Try to fetch existing record for today
  let { data, error } = await client
    .from('user_daily_new_questions')
    .select('new_count')
    .eq('user_id', userId)
    .eq('for_date', today)
    .maybeSingle(); // Returns null without error if not found

  // 2. If it doesn't exist, create the "starting" record
  if (!data && !error) {
    const { data: newData, error: insertError } = await client
      .from('user_daily_new_questions')
      .insert({ 
        user_id: userId, 
        for_date: today, 
        new_count: 0 // Start at 0 used
      })
      .select('new_count')
      .single();
    
    data = newData;
    error = insertError;
  }

  if (error) {
    console.error("Error syncing daily budget:", error.message);
    return { ok: false, error: error.message };
  }
  const used = data?.new_count ?? 0;
  const remaining = Math.max(0, DAILY_NEW_LIMIT - used);

  return { ok: true, remaining, used };
}
async function incrementDailyBudget(userId, amount) {
  if (amount <= 0) return { ok: true };

  const today = new Date().toISOString().split('T')[0];

  const { error } = await client.rpc('increment_daily_new_questions', {
    p_user_id: userId,
    p_date:    today,
    p_amount:  amount,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
  

async function selectQuestionsForModule(userId, moduleId, limit, allowedTypes, newBudget) {
  const today = new Date().toISOString().split('T')[0];
  const collected = new Set();
  
  // --- PRE-FETCH: Get ALL seen question IDs for this user & module ---
  // This gracefully handles new users (returns empty array) and fixes the LEFT JOIN flaw.
  const { data: progressData, error: progressError } = await client
    .from('questions')
    .select('id, user_question_progress!inner(question_id)')
    .eq('module_id', moduleId)
    .eq('user_question_progress.user_id', userId);

  if (progressError) return { ok: false, error: progressError.message, step: "prefetch step" };
  
  // Map out the IDs the user has already encountered
  const seenIds = progressData.map(q => q.id);

  // --- Step 1: Due questions (spaced repetition, highest priority) ---
  if (collected.size < limit && seenIds.length > 0) {
    const { data, error } = await client
      .from('questions')
      .select('id, user_question_progress!inner(next_review_date)')
      .eq('module_id', moduleId)
      .eq('user_question_progress.user_id', userId)
      .in('question_type', allowedTypes)
      .lte('user_question_progress.next_review_date', today)
      .order('random_key')
      .limit(limit);

    if (error) return { ok: false, error: error.message, step: "step 1" };
    data.forEach(q => collected.add(q.id));
  }

  // --- Step 2: New questions (never seen, capped by budget) ---
  const newSlots = Math.min(limit - collected.size, newBudget);
  let newlySeenIds = [];

  if (newSlots > 0) {
    let query = client
      .from('questions')
      .select('id')
      .eq('module_id', moduleId)
      .in('question_type', allowedTypes)
      .order('random_key')
      .limit(newSlots);

    // Only apply the 'not in' filter if they have actually seen questions.
    // This prevents the empty array '()' syntax error.
    if (seenIds.length > 0) {
    query = query.not('id', 'in', seenIds);  // ← pass array directly
    }

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message, step: "step 2" };

    data.forEach(q => {
      if (!collected.has(q.id)) {
        collected.add(q.id);
        newlySeenIds.push(q.id);
      }
    });
  }

  // --- Step 3: Filler (not yet due, only if still under limit) ---
  if (collected.size < limit && seenIds.length > 0) {
    const needed = limit - collected.size;
    const exclude = [...collected];

    let query = client
      .from('questions')
      .select('id, user_question_progress!inner(next_review_date)')
      .eq('module_id', moduleId)
      .eq('user_question_progress.user_id', userId)
      .in('question_type', allowedTypes)
      .gt('user_question_progress.next_review_date', today)
      .order('random_key')
      .limit(needed);

    // Safely exclude collected items
    if (exclude.length > 0) {
      query = query.not('id', 'in', exclude);
    }

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message, step: "step 3"};
    
    data.forEach(q => collected.add(q.id));
  }

  return {
    ok:           true,
    questionIds:  [...collected].slice(0, limit),
    newlySeenIds,
  };
}


async function selectQuestionsForAllModules(userId, modules, totalNum, allowedTypes, newBudget) {
  const base  = Math.floor(totalNum / modules.length);
  let   extra = totalNum % modules.length;

  let allQuestionIds  = [];
  let allNewlySeenIds = [];
  let remainingBudget = newBudget;

  for (const moduleId of modules) {
    const limit = base + (extra > 0 ? 1 : 0);
    extra--;

    if (limit <= 0) continue;
    
    const result = await selectQuestionsForModule(
      userId, moduleId, limit, allowedTypes, remainingBudget
    );

    if (!result.ok) return result;

    allQuestionIds  = allQuestionIds.concat(result.questionIds);
    allNewlySeenIds = allNewlySeenIds.concat(result.newlySeenIds);
    remainingBudget = Math.max(0, remainingBudget - result.newlySeenIds.length);
  }

  if (allQuestionIds.length === 0)
    return { ok: false, error: 'No questions available' };

  return {
  ok: true,
  questionIds: allQuestionIds.toSorted(() => Math.random() - 0.5),
  newlySeenIds: allNewlySeenIds,
};

}

async function insertProgressForNewQuestions(userId, newlySeenIds) {
  if (newlySeenIds.length === 0) return { ok: true };

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Fetch module_id for each question directly from the source
  const { data, error } = await client
    .from('questions')
    .select('id, module_id')
    .in('id', newlySeenIds);

  if (error) return { ok: false, error: error.message };

  const records = data.map(q => ({
    user_id:          userId,
    question_id:      q.id,
    module_id:        q.module_id,
    first_seen:       today,
    next_review_date: tomorrow,
    interval_days:    1,
  }));

  const { error: upsertError } = await client
    .from('user_question_progress')
    .upsert(records, {
      onConflict:       'user_id,question_id',
      ignoreDuplicates: true,
    });

  if (upsertError) return { ok: false, error: upsertError.message };
  return { ok: true };
}


async function saveQuiz(userId, type, questionIds) {
  const { data, error } = await client
    .from('quizzes')
    .insert({
      user_id:         userId,
      quiz_type:       type,
      total_questions: questionIds.length,
      question_ids:    questionIds,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, quizId: data.id };
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
  const selection = await selectQuestionsForAllModules(
    user.id, modules, num, params.allowedTypes, budget.remaining
  );
  console.log(selection);
  if (!selection.ok) return { ok: false, error: selection.error };
  
  const progressResult = await insertProgressForNewQuestions(
  user.id, selection.newlySeenIds
  );
  console.log(progressResult);
  if (!progressResult.ok) return { ok: false, error: progressResult.error };

  // 5. Increment daily budget
  const budgetResult = await incrementDailyBudget(user.id, selection.newlySeenIds.length);
  console.log(budgetResult);
  if (!budgetResult.ok) return { ok: false, error: budgetResult.error };
  
  const quiz = await saveQuiz(user.id, type, selection.questionIds);
  console.log(quiz);
  if (!quiz.ok) return { ok: false, error: quiz.error };

  return { ok: true, quizId: quiz.quizId };
}