import { useMemo } from 'react';
import { useStore } from '@/store/useStore';

export const useGuestMode = () => {
  const user = useStore((state) => state.user);
  
  const isGuestMode = useMemo(() => {
    return !user || !user.id;
  }, [user]);

  return {
    isGuestMode,
    user
  };
};
