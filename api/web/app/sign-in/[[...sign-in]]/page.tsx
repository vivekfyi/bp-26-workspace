import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <main className="auth-page">
    <ClerkLoading><div className="auth-loading">Loading secure sign-in…</div></ClerkLoading>
    <ClerkLoaded><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" /></ClerkLoaded>
  </main>;
}
