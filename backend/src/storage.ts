// Archivos de los recursos en Supabase Storage (bucket privado). La BD solo guarda la ruta (docs/PLAN.md §3).
// El archivo nunca pasa por nuestro backend (Vercel limita las peticiones a 4,5 MB): damos URLs firmadas.
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'recursos'

function bucket() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ver backend/.env.example)')
  return createClient(url, key, { auth: { persistSession: false } }).storage.from(BUCKET)
}

/** URL para que el navegador suba el archivo directamente a Supabase (PUT). */
export async function urlDeSubida(path: string) {
  const { data, error } = await bucket().createSignedUploadUrl(path)
  if (error) throw error
  return data.signedUrl
}

/** URL de descarga que caduca en 5 minutos, con el nombre original del archivo. */
export async function urlDeDescarga(path: string, nombre: string) {
  const { data, error } = await bucket().createSignedUrl(path, 300, { download: nombre })
  if (error) throw error
  return data.signedUrl
}

export async function borrarArchivo(path: string) {
  const { error } = await bucket().remove([path])
  if (error) throw error
}
