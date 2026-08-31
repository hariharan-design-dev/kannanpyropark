'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string;
}

export const SafeImage = ({ src, alt, ...props }: SafeImageProps) => {
  const [hasError, setHasError] = useState(false);

  // If Next.js optimizer fails with a 500, fallback directly to Supabase URL
  if (hasError) {
    return (
      <Image
        {...props}
        src={encodeURI(src)}
        alt={alt}
        unoptimized
      />
    );
  }

  return (
    <Image
      {...props}
      src={encodeURI(src)}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
};