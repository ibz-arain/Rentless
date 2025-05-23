'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * ClientSessionChecker ensures the session state is properly synced
 * and maintained across page refreshes.
 * This is especially important for pages with authentication state.
 * It doesn't render anything visually, just handles session syncing.
 */
export default function ClientSessionChecker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // This effect runs when the session status changes
    // It's mainly to trigger rerendering when session state changes
    if (status === 'authenticated') {
      console.log('User is authenticated:', session?.user?.email);
    } else if (status === 'loading') {
      console.log('Session loading...');
    } else {
      console.log('User is not authenticated');
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
} 