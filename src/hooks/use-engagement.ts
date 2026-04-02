"use client";

import { useCallback, useRef } from 'react';

export function useEngagement(propertyId: number) {
  const sentEvents = useRef<Set<string>>(new Set());

  const trackEvent = useCallback(async (eventType: string, durationSeconds = 0) => {
    // Prevent duplicate events of the same type for the same property in the same session
    const key = `${propertyId}-${eventType}`;
    if (eventType === 'view_half' || eventType === 'view_complete') {
      if (sentEvents.current.has(key)) return;
      sentEvents.current.add(key);
    }

    try {
      await fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          event_type: eventType,
          duration_seconds: durationSeconds,
        }),
      });
    } catch {
      // Silent fail for engagement tracking
    }
  }, [propertyId]);

  return { trackEvent };
}
