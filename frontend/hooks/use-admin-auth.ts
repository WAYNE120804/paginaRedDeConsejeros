'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';

export type AdminRole = 'SUPERADMIN' | 'SECRETARIO' | 'COMUNICACIONES';

interface MeResponse {
  data: {
    email: string;
    role: AdminRole;
  };
  error: null;
}

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onLogin = pathname === '/admin/login';
    if (onLogin) {
      setIsLoading(false);
      return;
    }

    apiClient
      .get<MeResponse>('/auth/me')
      .then((response) => {
        setRole(response.data.role);
        setEmail(response.data.email);
      })
      .catch(() => {
        router.replace('/admin/login');
      })
      .finally(() => setIsLoading(false));
  }, [pathname, router]);

  return useMemo(() => ({ isLoading, role, email }), [isLoading, role, email]);
}
