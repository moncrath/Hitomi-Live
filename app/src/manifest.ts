import { MANIFEST_URL } from './config';
import type { Manifest } from './types';

export async function loadManifest(): Promise<Manifest> {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Gagal muat manifest (${res.status}): ${MANIFEST_URL}`);
  return (await res.json()) as Manifest;
}
