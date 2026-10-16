import { useEffect, useState } from "react";

/**
 * Subscribes to live data for the lifetime of a component.
 *
 * `subscribe` is called with `(onData, onError)` and must return an unsubscribe
 * function. `deps` controls when the subscription is recreated (like a
 * `useEffect` dependency array).
 */
export function useLiveData(subscribe, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setError(null);
    setLoading(true);

    const unsubscribe = subscribe(
      (next) => {
        if (!active) return;
        setData(next);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
