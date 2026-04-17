export const LEVELS = ['basico', 'intermedio', 'avanzado', 'experto'];

export const LEVEL_LABELS = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
  experto: 'Experto',
};

export const LEVEL_DESCRIPTIONS = {
  basico: 'Nivel Primaria',
  intermedio: 'Nivel Bachillerato',
  avanzado: 'Nivel Universitario',
  experto: 'Alta Complejidad',
};

// Questions correct to advance per level
export const QUESTIONS_PER_LEVEL = 50;

// Points per correct answer
export const POINTS_PER_CORRECT = 10;
export const POINTS_PER_WRONG = 0;

/**
 * Get user level based on total correct answers
 */
export function getLevelFromCorrect(questionsAnswered) {
  if (questionsAnswered < 50) return 'basico';
  if (questionsAnswered < 100) return 'intermedio';
  if (questionsAnswered < 150) return 'avanzado';
  return 'experto';
}

/**
 * Get progress within current level (0–1)
 */
export function getLevelProgress(questionsAnswered) {
  const inLevel = questionsAnswered % QUESTIONS_PER_LEVEL;
  return inLevel / QUESTIONS_PER_LEVEL;
}

/**
 * How many questions answered in current level
 */
export function getQuestionsInLevel(questionsAnswered) {
  return questionsAnswered % QUESTIONS_PER_LEVEL;
}
