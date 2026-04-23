import { useState, useEffect } from 'react';

// 通用数据获取 Hook - 使用 any 类型简化
export function useFetch(url: string): { data: any; loading: boolean; error: string | null } {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('数据未找到，请先运行 R 分析脚本生成数据');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          const errorMessage = e instanceof Error ? e.message : '未知错误';
          setError(errorMessage);
          console.error(`Failed to fetch ${url}:`, errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [url]);

  return { data, loading, error };
}

// 多个 API 并行获取 Hook
export function useMultipleFetch(
  urls: Record<string, string>
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
          Object.entries(urls).map(async ([key, url]) => {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            return [key, json];
          })
        );
        if (mounted) {
          setData(Object.fromEntries(entries));
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : '未知错误');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [JSON.stringify(urls)]);

  return { data, loading, error };
}