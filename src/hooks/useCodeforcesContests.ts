import { useEffect, useState } from 'react';
import type { Contest } from '../types';
import { formatTimeUntil } from '../lib/utils';

export function useCodeforcesContests(pollIntervalMs = 1000 * 60 * 5) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://codeforces.com/api/contest.list');
      if (!res.ok) {
        throw new Error(`Codeforces API request failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.status !== 'OK') throw new Error(data.comment || 'Unexpected response');

      // Filter for upcoming contests (phase === 'BEFORE'), and sort by start time ascending
      const upcoming = (data.result as any[])
        .filter((c) => c.phase === 'BEFORE')
        .sort((a, b) => (a.startTimeSeconds || 0) - (b.startTimeSeconds || 0))
        .map((c) => ({
          id: c.id,
          name: c.name,
          platform: 'Codeforces',
          startTimeSeconds: c.startTimeSeconds,
          durationSeconds: c.durationSeconds,
          time: formatTimeUntil(c.startTimeSeconds),
        } as Contest));

      setContests(upcoming);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
    const id = setInterval(fetchContests, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs]);

  return { contests, loading, error };
}

export default useCodeforcesContests;
