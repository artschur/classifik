'use client';

import { AnalyticsEvents, insertAnalyticsEvent } from '@/db/queries/analytics';
import { useEffect } from 'react';


export function useAnalytics() {
    const trackEvent = async (
        companionId: number,
        eventType: AnalyticsEvents,
        metadata: Record<string, any> = {}
    ) => {

        try {
            insertAnalyticsEvent({
                companionId: companionId,
                event_type: eventType,
                metadata,
            });
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    };

    return { trackEvent };
}

// Specialized hook for page views with automatic tracking
export function usePageViewAnalytics(companionId: number) {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        trackEvent(companionId, 'page_view');
    }, [companionId]);
}