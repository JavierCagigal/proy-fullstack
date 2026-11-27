// Utilidades de validación compartidas por las rutas de la API.

export const texto = (v: unknown) => String(v ?? '').trim()

/** Id de la URL; si no es un número, uno que no existe (→ 404 en vez de un error de Prisma). */
export const idDe = (v: unknown) => (/^\d+$/.test(String(v)) ? Number(v) : -1)

/** Solo enlaces http(s): nada de javascript: ni data:. */
export const esUrl = (v: string) => /^https?:\/\/\S+$/i.test(v)

/** Fecha válida o null. */
export function fecha(v: unknown) {
  const d = new Date(String(v ?? ''))
  return v && !Number.isNaN(d.getTime()) ? d : null
}

/** Código de Prisma para "ya existe" (restricción UNIQUE). */
export const esDuplicado = (e: unknown) => (e as { code?: string })?.code === 'P2002'
