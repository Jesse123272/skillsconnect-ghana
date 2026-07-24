'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtisansBridge() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/browse');
  }, [router]);

  return null;
}
