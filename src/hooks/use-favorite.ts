"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";

export function useFavorite(propertyId: number) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`/api/favorites/check?property_id=${propertyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setFavorited(data.favorited);
          setLikesCount(data.likes_count);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [propertyId, user]);

  const toggle = useCallback(async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Optimistic update
    const prevFavorited = favorited;
    const prevCount = likesCount;
    setFavorited(!favorited);
    setLikesCount(favorited ? likesCount - 1 : likesCount + 1);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setFavorited(data.favorited);
      setLikesCount(data.likes_count);
    } catch {
      // Revert on error
      setFavorited(prevFavorited);
      setLikesCount(prevCount);
    }
  }, [user, favorited, likesCount, propertyId]);

  return { favorited, likesCount, toggle, loading };
}
