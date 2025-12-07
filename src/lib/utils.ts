export const chooseColorForProblem = (seed: string, allColors: string[]) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % allColors.length;
  return allColors[idx];
};

export const generateTeamCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const formatTimeUntil = (startTimeSeconds?: number): string => {
  if (!startTimeSeconds) return 'TBD';
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Math.max(0, startTimeSeconds - now);
  if (secondsLeft === 0) return 'Starting Soon';

  const days = Math.floor(secondsLeft / (3600 * 24));
  const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${secondsLeft}s`;
};
