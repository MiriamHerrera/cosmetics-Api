import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBeforeUnload } from './useBeforeUnload';

export const useNavigationGuard = () => {
  const router = useRouter();
  const { confirmAndClearCart } = useBeforeUnload();

  // Interceptar navegación programática
  const guardedPush = useCallback(async (href: string) => {
    console.log(`🧭 Intentando navegar a: ${href}`);
    
    const canProceed = await confirmAndClearCart(() => {
      console.log(`✅ Navegación confirmada, ejecutando: router.push(${href})`);
      router.push(href);
    });
    
    if (canProceed) {
      console.log(`🚀 Navegación permitida inmediatamente: ${href}`);
      router.push(href);
    } else {
      console.log(`⏳ Navegación en espera de confirmación del usuario`);
    }
  }, [confirmAndClearCart, router]);

  const guardedReplace = useCallback(async (href: string) => {
    const canProceed = await confirmAndClearCart(() => {
      router.replace(href);
    });
    
    if (canProceed) {
      router.replace(href);
    }
  }, [confirmAndClearCart, router]);

  const guardedBack = useCallback(async () => {
    const canProceed = await confirmAndClearCart(() => {
      router.back();
    });
    
    if (canProceed) {
      router.back();
    }
  }, [confirmAndClearCart, router]);

  const guardedForward = useCallback(async () => {
    const canProceed = await confirmAndClearCart(() => {
      router.forward();
    });
    
    if (canProceed) {
      router.forward();
    }
  }, [confirmAndClearCart, router]);

  // Interceptar clicks en enlaces que podrían salir del sitio
  useEffect(() => {
    const handleLinkClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href');
        const targetAttr = link.getAttribute('target');
        
        // Solo interceptar enlaces que salgan del sitio o abran nueva pestaña
        if (targetAttr === '_blank' || (href && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')))) {
          const canProceed = await confirmAndClearCart(() => {
            // Permitir que el enlace se abra normalmente
          });
          
          if (!canProceed) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [confirmAndClearCart]);

  return {
    guardedPush,
    guardedReplace,
    guardedBack,
    guardedForward
  };
}; 