'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type React from 'react'; // Added import for React

export default function CompanionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Button variant="default" onClick={router.back} className="mb-6">
          Go back
        </Button>
        {children}
      </div>
    </div>
  );
}
