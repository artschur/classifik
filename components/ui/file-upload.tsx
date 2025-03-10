'use client';

import { cn } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IconUpload } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  previewUrl: string;
}

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateProgress = (id: string) => {
    // This simulates upload progress; in a real app you would update progress based on actual upload events.
    const interval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((uf) =>
          uf.id === id
            ? {
                ...uf,
                progress: Math.min(uf.progress + Math.random() * 10, 100),
              }
            : uf
        )
      );
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  };

  const handleFileChange = (newFiles: File[]) => {
    const newUploadFiles: UploadFile[] = newFiles.map((file) => {
      const id = file.name + '-' + Date.now();
      // Start simulation of progress after adding the file.
      setTimeout(() => simulateProgress(id), 500);
      return {
        id,
        file,
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      };
    });
    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {},
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <input
        ref={fileInputRef}
        id="file-upload-handle"
        type="file"
        multiple
        onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
        className="hidden"
      />

      {/* File Upload Section Always Visible */}
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border border-dashed border-gray-300 dark:border-neutral-700"
      >
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Faça upload de suas imagens ou vídeos.
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Arraste e solte ou clique aqui para enviar.
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {isDragActive ? (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 w-full max-w-[8rem] mx-auto rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-neutral-600 flex flex-col items-center"
                >
                  Solte os arquivos aqui
                  <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 w-full max-w-[8rem] mx-auto rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
              >
                <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
              </motion.div>
            )}
            <motion.div
              variants={secondaryVariant}
              className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 w-full max-w-[8rem] mx-auto rounded-md"
            />
          </div>
        </div>

        {/* Previews Grid & Upload Button */}
        <div className="mt-6 flex flex-col items-center">
          {uploadFiles.length > 0 && (
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {uploadFiles.map((uploadFile, idx) => (
                <motion.div
                  key={uploadFile.id}
                  layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                  className={cn(
                    'relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start p-4 rounded-lg shadow-sm'
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <div className="flex flex-row items-center gap-6 font-mono">
                      {uploadFile.file.type.startsWith('video') ? (
                        <video
                          className="rounded-md"
                          src={uploadFile.previewUrl}
                          controls
                          width={50}
                          height={50}
                        />
                      ) : (
                        <Image
                          className="rounded-md"
                          src={uploadFile.previewUrl}
                          alt={uploadFile.file.name}
                          width={50}
                          height={50}
                        />
                      )}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="text-xs text-pretty text-neutral-700 dark:text-neutral-400 truncate max-w-xs"
                      >
                        {uploadFile.file.name}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="rounded-lg px-2 py-1 min-w-24 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                      >
                        {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                    </div>
                  </div>
                  <div className="mt-2 w-full">
                    <div className="w-full h-2 bg-gray-300 dark:bg-neutral-700 rounded">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {Math.floor(uploadFile.progress)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-primary/10 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex flex-shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-gray-50 dark:bg-neutral-950'
                  : 'bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]'
              }`}
            />
          );
        })
      )}
    </div>
  );
}
