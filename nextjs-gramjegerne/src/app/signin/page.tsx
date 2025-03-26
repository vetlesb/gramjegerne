import {SignIn} from '@/components/auth/SignIn';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/5 rounded-lg shadow-lg">
        {/* Logo or App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-accent">Gramjegerne</h1>
          <p className="mt-2 text-white/80">Log in to continue</p>
        </div>

        {/* Sign In Component */}
        <SignIn />

        {/* Optional: Additional Info */}
        <div className="text-center text-sm text-white/60">
          <p>By logging in, you agree to our terms and conditions</p>
        </div>
      </div>
    </main>
  );
}
