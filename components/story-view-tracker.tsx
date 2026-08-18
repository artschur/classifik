'use client';

import { useEffect } from 'react';
import { incrementStoryViews } from '@/app/actions/story-views';

export function StoryViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    incrementStoryViews(slug).catch(() => {});
  }, [slug]);
  return null;
}
