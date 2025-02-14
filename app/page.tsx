'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadImage } from '@/db/queries/images';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/nextjs';
import { GetCurrentUserImages } from '@/components/companionsList';

export default function CompanionsPage() {
  const [uploadStatus, setUploadStatus] = useState('');

  const { toast } = useToast();
  const user = useUser();
  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;
    for (const file of files) {
      const result = await uploadImage(file);
      if (result.error) {
        setUploadStatus(`Upload failed: ${result.error.message}`);
      } else {
        toast({
          title: 'Image uploaded',
          description: 'Your image has been uploaded successfully',
          variant: 'success',
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Companions</h1>
      <GetCurrentUserImages userId={user.user?.id ?? ''} />
      <FileUpload onChange={handleFileUpload} />
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
}