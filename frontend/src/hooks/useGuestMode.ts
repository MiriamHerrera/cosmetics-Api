import { useStore } from '@/store/useStore';

export const useGuestMode = () => {
  const { user } = useStore();
  
  // El usuario está en modo invitado si no hay usuario autenticado
  const isGuestMode = !user;
  
  return {
    isGuestMode,
    user
  };
}; 