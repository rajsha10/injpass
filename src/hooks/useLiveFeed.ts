import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type RecentEvent = 'NONE' | 'GOAL' | 'MATCH_END_WIN';

export interface LiveFeed {
  eventId: string;
  minute: number;
  score: string;
  recentEvent: RecentEvent;
}

export interface UseLiveFeedReturn {
  feed: LiveFeed | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 2000; // 2 seconds for instant demo video responsiveness
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useLiveFeed(eventId?: string | null): UseLiveFeedReturn {
  const [feed, setFeed] = useState<LiveFeed | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFeed = async () => {
    if (!eventId) {
      setFeed(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/events/live-feed?eventId=${eventId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LiveFeed = await res.json();
      setFeed(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useLiveFeed] Backend feed fetch failed:', msg);
      setError(`Backend feed offline (${msg})`);
      setFeed(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    intervalRef.current = setInterval(fetchFeed, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [eventId]);

  return { feed, loading, error, lastUpdated };
}