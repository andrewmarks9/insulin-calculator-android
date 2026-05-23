import { useState, useCallback } from 'react';

export function useExportStatus() {
  const [exportStatus, setExportStatus] = useState(null);

  const setTimedStatus = useCallback((status, ms = 5000) => {
    setExportStatus(status);
    setTimeout(() => setExportStatus(null), ms);
  }, []);

  return [exportStatus, setTimedStatus];
}
