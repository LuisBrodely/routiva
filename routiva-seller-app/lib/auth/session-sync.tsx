import { getUserContext } from '@/lib/auth/get-user-context';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/session-store';
import * as React from 'react';

function SessionSync() {
  const setSession = useSessionStore((state) => state.setSession);
  const setUserContext = useSessionStore((state) => state.setUserContext);
  const clearSession = useSessionStore((state) => state.clearSession);

  React.useEffect(() => {
    let isMounted = true;

    async function syncInitialSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted || error) return;

      if (!data.session) {
        clearSession();
        return;
      }

      setSession({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        userId: data.session.user.id,
        role: null,
      });

      try {
        const userContext = await getUserContext(data.session.user.id);
        if (!isMounted) return;
        if (userContext.role !== 'SELLER') {
          clearSession();
          return;
        }
        setUserContext(userContext);
      } catch {
        if (!isMounted) return;
        setUserContext({
          username: null,
          empresaId: null,
          empresaNombre: null,
          vendedorId: null,
          vendedorNombre: null,
          role: null,
        });
      }
    }

    void syncInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        clearSession();
        return;
      }

      setSession({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        userId: session.user.id,
        role: null,
      });

      try {
        const userContext = await getUserContext(session.user.id);
        if (!isMounted) return;
        if (userContext.role !== 'SELLER') {
          clearSession();
          return;
        }
        setUserContext(userContext);
      } catch {
        if (!isMounted) return;
        setUserContext({
          username: null,
          empresaId: null,
          empresaNombre: null,
          vendedorId: null,
          vendedorNombre: null,
          role: null,
        });
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearSession, setSession, setUserContext]);

  return null;
}

export { SessionSync };
