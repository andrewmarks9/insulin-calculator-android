import { useState, useEffect } from 'react';
import { getHistory } from '../utils/storage';

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  return [history, setHistory];
}
