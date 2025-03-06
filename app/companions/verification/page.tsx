import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DocumentVerificationForm } from '@/components/documentVerificationForm';
import { getCompanionByClerkId } from '@/db/queries/companions';

export const dynamic = 'force-dynamic';

export default async function DocumentVerificationPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }
  
  // Check if the user is a registered companion
  try {
    const companion = await getCompanionByClerkId(userId);
    if (!companion) {
      redirect('/companions/register');
    }
  } catch (error) {
    // If there's an error or companion not found, redirect to register
    redirect('/companions/register');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Document Verification</h1>
      <p className="text-muted-foreground mb-8">
        To verify your account, please upload the required documents. 
        Your account will be verified once our team reviews your documents.
      </p>
      <DocumentVerificationForm />
    </div>
  );
}