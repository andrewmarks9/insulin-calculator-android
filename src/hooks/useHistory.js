import { useState } from 'react';
import { getHistory } from '../utils/storage';

export function useHistory() {
  const [history, setHistory] = useState(() => getHistory());

  return [history, setHistory];
}
