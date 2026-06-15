import { useEffect, useState } from 'react';
import { cachedJson } from '../lib/preloadData';

export function useFetch(url: string): { data: any; loading: boolean; error: string | null } {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const json = await cachedJson(url);
        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(message);
          console.error(`Failed to fetch ${url}:`, message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, loading, error };
}

export function useMultipleFetch(
  urls: Record<string, string>,
): { data: Record<string, any>; loading: boolean; error: string | null } {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const entries = await Promise.all(
          Object.entries(urls).map(async ([key, endpoint]) => {
            return [key, await cachedJson(endpoint)];
          }),
        );
        if (mounted) {
          setData(Object.fromEntries(entries));
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [JSON.stringify(urls)]);

  return { data, loading, error };
}
