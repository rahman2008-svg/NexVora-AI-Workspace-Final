import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Loads async data every time the screen gains focus, with loading/error/refresh state. */
export default function useNexData<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await loader());
    } catch (e) {
      console.error('[useNexData]', e);
      setError((e as Error)?.message || 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loader]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const refresh = useCallback(() => { setRefreshing(true); load(); }, [load]);
  return { data, loading, refreshing, error, refresh, reload: load, setData };
}
