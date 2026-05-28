import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Class } from '@/types';

/**
 * Hook for teacher pages. Returns only classes assigned to this teacher.
 * `noClasses` is true (after loading) when none are assigned — use it to
 * show the "contact principal" message and block the rest of the UI.
 */
export function useTeacherClasses() {
  const user = useAuthStore((s) => s.user);
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    api.get<Class[]>(`/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId]);

  const noClasses = !loading && classes.length === 0;

  return { classes, loading, noClasses, schoolId };
}