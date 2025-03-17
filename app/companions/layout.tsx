'use client';

import { CompanionPageBreadcrumb } from '@/components/companionPageBreadcrumb';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type React from 'react'; // Added import for React
import { Suspense } from 'react';

export default function CompanionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CompanionPageBreadcrumb />
        {children}
      </div>
    </div>
  );
}
