import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  if (
    sessionClaims?.metadata?.onboardingComplete === true &&
    sessionClaims?.metadata?.isCompanion === true
  ) {
    redirect('/register');
  }

  if (
    sessionClaims?.metadata?.onboardingComplete === true &&
    sessionClaims?.metadata?.isCompanion === false
  ) {
    redirect('/location');
  }

  return <>{children}</>;
}
