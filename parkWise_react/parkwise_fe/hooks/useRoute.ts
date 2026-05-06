"use client";

import { useCallback, useEffect, useState } from "react";

export function useRoute() {
  const [path, setPath] = useState("/");
  const [query, setQuery] = useState(new URLSearchParams());

  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname);
      setQuery(new URLSearchParams(window.location.search));
    };

    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const push = useCallback((nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(window.location.pathname);
    setQuery(new URLSearchParams(window.location.search));
  }, []);

  return { path, query, push };
}
