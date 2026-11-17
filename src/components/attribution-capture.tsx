'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

/** Registra de onde o visitante veio (utm_source etc.) assim que ele chega ao site. */
export function AttributionCapture() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
