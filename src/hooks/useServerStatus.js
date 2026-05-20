import { useEffect, useState } from 'react';

export const useServerStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [checking, setChecking] = useState(true);

  const check = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline, checking, retry: check };
};