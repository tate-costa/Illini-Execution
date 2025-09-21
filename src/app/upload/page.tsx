
'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Upload Your Avatar</CardTitle>
          <CardDescription>Select a JPEG, PNG, or WEBP file to upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setIsUploading(true);
              setError(null);
              setBlob(null);

              if (!inputFileRef.current?.files) {
                setError("No file selected.");
                setIsUploading(false);
                return;
              }

              const file = inputFileRef.current.files[0];

              try {
                const response = await fetch(
                  `/api/avatar/upload?filename=${file.name}`,
                  {
                    method: 'POST',
                    body: file,
                  },
                );

                if (!response.ok) {
                  const errorResult = await response.json();
                  throw new Error(errorResult.error || 'Failed to upload file.');
                }

                const newBlob = (await response.json()) as PutBlobResult;
                setBlob(newBlob);
              } catch (err: any) {
                setError(err.message);
              } finally {
                setIsUploading(false);
              }
            }}
          >
            <div className="space-y-4">
                <Input name="file" ref={inputFileRef} type="file" accept="image/jpeg,image/png,image/webp" required />
                <Button type="submit" className="w-full" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
            </div>
          </form>
          {blob && (
            <div className="mt-6 bg-muted p-4 rounded-md text-sm">
              <p className="font-semibold">Upload Successful!</p>
              <p className="break-words mt-2">
                URL: <a href={blob.url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{blob.url}</a>
              </p>
            </div>
          )}
           {error && (
            <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md text-sm">
              <p className="font-semibold">Upload Failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
