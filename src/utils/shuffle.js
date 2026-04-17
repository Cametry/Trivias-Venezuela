/**
 * Fisher-Yates shuffle for question options.
 * Returns { shuffledOptions, correctShuffledIndex }
 */
export function shuffleOptions(options, correctIndex) {
  // Create indexed pairs
  const indexed = options.map((opt, i) => ({ opt, i }));

  // Fisher-Yates
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  const shuffledOptions = indexed.map(({ opt }) => opt);
  const correctShuffledIndex = indexed.findIndex(({ i }) => i === correctIndex);

  return { shuffledOptions, correctShuffledIndex };
}

/**
 * Generic array shuffle (for questions list)
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
