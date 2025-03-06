'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  uploadDocument,
  getDocumentsByAuthId,
  deleteDocument,
} from '@/app/actions/document-verification';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  X,
  Check,
  Upload,
  AlertTriangle,
  VideoIcon,
  FileText,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const DocumentFormSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  file: z.any().refine((file) => file instanceof File, {
    message: 'File is required',
  }),
});

type Document = {
  id: number;
  document_type: string;
  public_url: string;
  storage_path: string;
  verified: boolean;
  verification_date: string | null;
  notes: string | null;
  created_at: string;
};

export function DocumentVerificationForm() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [documentToDelete, setDocumentToDelete] = React.useState<number | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [videoUploaded, setVideoUploaded] = React.useState(false);

  const form = useForm<z.infer<typeof DocumentFormSchema>>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: {
      documentType: '',
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchDocuments() {
      if (isLoaded && user?.id) {
        setIsLoading(true);
        try {
          const result = await getDocumentsByAuthId(user.id);
          if (result.success) {
            setDocuments(result.documents as Document[]);
            // Check if verification video is already uploaded
            const hasVerificationVideo = (result.documents as Document[]).some(
              (doc) => doc.document_type === 'verification_video'
            );
            setVideoUploaded(hasVerificationVideo);
          } else {
            toast({
              title: 'Error fetching documents',
              description: result.error,
              variant: 'destructive',
            });
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch documents',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchDocuments();
  }, [isLoaded, user?.id, toast]);

  async function onSubmit(data: z.infer<typeof DocumentFormSchema>) {
    if (!isLoaded || !user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload documents',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('documentType', data.documentType);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Document uploaded',
          description:
            'Your document has been uploaded successfully and is pending verification',
          variant: 'success',
        });

        // Reset form
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh documents list
        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          // Update video upload state
          setVideoUploaded(
            updatedDocs.documents.some(
              (doc: Document) => doc.document_type === 'verification_video'
            )
          );
        }
      } else {
        toast({
          title: 'Upload failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred while uploading the document',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (
      !isLoaded ||
      !user?.id ||
      !e.target.files ||
      e.target.files.length === 0
    ) {
      return;
    }

    const videoFile = e.target.files[0];
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('documentType', 'verification_video');

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Verification video uploaded',
          description:
            'Your verification video has been uploaded successfully and is pending review',
          variant: 'success',
        });

        // Reset input
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }

        // Refresh documents list
        const updatedDocs = await getDocumentsByAuthId(user.id);
        if (updatedDocs.success) {
          setDocuments(updatedDocs.documents as Document[]);
          setVideoUploaded(true);
        }
      } else {
        toast({
          title: 'Upload failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred while uploading the video',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteDocument = async (id: number) => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(id);

      if (result.success) {
        // Remove from local state
        const deletedDoc = documents.find((doc) => doc.id === id);
        setDocuments(documents.filter((doc) => doc.id !== id));

        // Update video upload state if we just deleted a verification video
        if (deletedDoc?.document_type === 'verification_video') {
          setVideoUploaded(false);
        }

        toast({
          title: 'Document deleted',
          description: 'Document has been deleted successfully',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const renderDocumentStatus = (verified: boolean) => {
    if (verified) {
      return (
        <div className="flex items-center text-green-600">
          <Check size={16} className="mr-1" />
          <span>Verified</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-amber-600">
        <AlertTriangle size={16} className="mr-1" />
        <span>Pending verification</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Verification Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <VideoIcon className="mr-2 h-6 w-6" />
            Verification Video
            {videoUploaded && (
              <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Pending Review
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Upload a short verification video to confirm your identity. This is
            required for account verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <Info className="h-4 w-4" />
            <AlertDialogTitle>
              Instructions for verification video:
            </AlertDialogTitle>
            <AlertDialogDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Record a short video (15-30 seconds) showing your face clearly
                </li>
                <li>Hold a paper with your name and age written on it</li>
                <li>
                  Write "onesugar" underneath your name and age on the paper
                </li>
                <li>Say your name out loud in the video</li>
                <li>Maximum video size: 100MB</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialog>

          {videoUploaded ? (
            <div className="text-center py-4">
              <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-green-600 font-medium">
                Video uploaded successfully
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your verification video is pending review. For privacy reasons,
                the video will be deleted after verification.
              </p>

              {documents
                .filter((doc) => doc.document_type === 'verification_video')
                .map((video) => (
                  <div key={video.id} className="mt-4 flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-destructive">
                          Delete Video
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete your verification video. You will
                            need to upload a new one for your account to be
                            verified.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDocument(video.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="max-w-md"
                onChange={handleVideoUpload}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-2">
                For privacy protection, this video will be automatically deleted
                after verification is complete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>ID Document Verification</CardTitle>
          <CardDescription>
            Upload your identification documents for verification. This is
            required to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="id_card">ID Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">
                          Driver's License
                        </SelectItem>
                        <SelectItem value="selfie">Selfie with ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of document you are uploading.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Document</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a clear image or PDF of your document (max 5MB).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            Documents you've submitted for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ||
            (documents.length === 1 &&
              documents[0].document_type === 'verification_video') ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents
                .filter((doc) => doc.document_type !== 'verification_video')
                .map((document) => (
                  <Card key={document.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3]">
                        {document.public_url.endsWith('.pdf') ? (
                          <div className="flex items-center justify-center h-full bg-muted p-4">
                            <p className="text-center">PDF Document</p>
                          </div>
                        ) : (
                          <Image
                            src={document.public_url}
                            alt={`${document.document_type} document`}
                            fill
                            className="object-cover"
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => setDocumentToDelete(document.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this document and
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  document.id &&
                                  handleDeleteDocument(document.id)
                                }
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold capitalize mb-1">
                          {document.document_type.replace('_', ' ')}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Uploaded on{' '}
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                        {renderDocumentStatus(document.verified)}
                        {document.notes && (
                          <p className="mt-2 text-sm italic border-l-2 border-muted-foreground pl-2">
                            {document.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
