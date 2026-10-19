'use client';

import { useAuth, useClerk } from '@clerk/nextjs';

export function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  return (
    <div className="auth-controls">
      {isLoaded && isSignedIn ? <button className="auth-link auth-button" type="button" onClick={() => void signOut({ redirectUrl: '/' })}>Log out</button> : <a className="auth-link" href="/sign-in">Log in</a>}
    </div>
  );
}
