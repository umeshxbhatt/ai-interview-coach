/**
 * Calculates the consecutive practice streak of a user in days.
 * @param dates Array of dates representing completed interviews, sorted descending.
 */
export const calculateStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;

  // Convert dates to clean local YYYY-MM-DD string representations to ignore hours/minutes differences
  const uniqueDates = Array.from(
    new Set(
      dates.map((d) => {
        const dateObj = new Date(d);
        return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      })
    )
  ).map((dStr) => new Date(dStr));

  if (uniqueDates.length === 0) return 0;

  // Get current date boundaries (today and yesterday)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

  const firstDate = uniqueDates[0];
  const firstDateStr = `${firstDate.getFullYear()}-${(firstDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${firstDate.getDate().toString().padStart(2, '0')}`;

  // If the user's most recent practice was neither today nor yesterday, their streak is broken
  if (firstDateStr !== todayStr && firstDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = uniqueDates[i];
    const next = uniqueDates[i + 1];

    // Compute difference in days
    const diffTime = Math.abs(current.getTime() - next.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      break; // Streak broken
    }
  }

  return streak;
};
