'use client';

import { useClerk, useUser } from '@clerk/nextjs';

export function AuthControls({ initialSignedIn = false }: { initialSignedIn?: boolean }) {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const signedIn = isLoaded ? Boolean(user) : initialSignedIn;

  return (
    <div className="auth-controls">
      {signedIn ? <button className="auth-link auth-button" type="button" onClick={() => void signOut({ redirectUrl: '/' })}>Log out</button> : <a className="auth-link" href="/sign-in">Log in</a>}
    </div>
  );
}
