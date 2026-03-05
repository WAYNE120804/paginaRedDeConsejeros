'use client';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" />
      </div>
    );
  }

  return <>{children}</>;
}
