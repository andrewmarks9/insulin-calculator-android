import { useState, useCallback } from 'react';

export function useAppStatus() {
  const [appStatus, setAppStatus] = useState(null);

  const setTimedStatus = useCallback((status, ms = 5000) => {
    setAppStatus(status);
    setTimeout(() => setAppStatus(null), ms);
  }, []);

  return [appStatus, setTimedStatus];
}
