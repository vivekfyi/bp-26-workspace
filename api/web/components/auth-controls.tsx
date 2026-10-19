'use client';

import { useClerk, useUser } from '@clerk/nextjs';

export function AuthControls() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="auth-controls">
      {!isLoaded ? <span className="auth-status">Checking session…</span> : user ? <button className="auth-link auth-button" type="button" onClick={() => void signOut({ redirectUrl: '/' })}>Log out</button> : <a className="auth-link" href="/sign-in">Log in</a>}
    </div>
  );
}
