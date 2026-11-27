# Despliegue: Supabase + Vercel

Guía para poner DAWHub en producción y entender cómo se conecta cada pieza.
Hazla **una sola vez**. Después, cada merge a `master` se despliega solo.

## 1. Cómo se conecta todo

```
                      https://proy-fullstack.vercel.app
 Navegador ─────────► Vercel · proyecto FRONTEND (root frontend/)
    │                   ├─ /, /retos, /clase…  → index.html (la SPA)
    │                   └─ /api/*  ── rewrite ──► Vercel · proyecto BACKEND (root backend/)
    │                                              Express como función serverless
    │                                              lee DATABASE_URL, JWT_SECRET… de sus variables
    │                                                │
    │                                                │ Prisma + pg (puerto 6543, pooler)
    │                                                ▼
    │                                              Supabase · PostgreSQL
    │
    └── subida/descarga de archivos directa ────► Supabase · Storage (bucket privado)
        con una URL firmada que da el backend      (bloque B, todavía no)
```

- **El frontend no tiene secretos.** Son archivos estáticos (HTML, JS y CSS) que cualquiera puede leer. Por eso **ninguna clave va en el proyecto de Vercel del frontend**.
- **El backend guarda los secretos** en sus *Environment Variables* de Vercel. En el código se leen con `process.env.NOMBRE`. Son las mismas claves que tu `backend/.env` local, pero con los valores de producción.
- **¿Por qué el `rewrite` de `/api/*`?** Para el navegador, la web y la API están en el mismo dominio (`proy-fullstack.vercel.app`). Así la cookie de sesión (JWT httpOnly) es *first-party* y Safari y Chrome no la bloquean. Además, no hace falta CORS.
- **Dos URLs de la BD:** las funciones de Vercel abren muchas conexiones cortas, así que usan el *Transaction pooler* (puerto 6543). Las migraciones de Prisma necesitan una sesión completa, así que usan el *Session pooler* (puerto 5432).

## 2. Qué copio y dónde lo pego

| Variable | Qué es | De dónde sale | Dónde va |
|---|---|---|---|
| `DATABASE_URL` | Conexión de la app a la BD (pooler, 6543) | Supabase → **Connect** → *Transaction pooler* | Vercel backend + tu terminal al hacer el seed |
| `DIRECT_URL` | Conexión para migrar (5432) | Supabase → **Connect** → *Session pooler* | Solo en tu terminal al migrar (**no** en Vercel) |
| `JWT_SECRET` | Clave para firmar las sesiones | La generas tú: `openssl rand -hex 32` | Vercel backend |
| `SEED_PASSWORD` | Contraseña de los usuarios de demo | La eliges tú (el repo es público y `dawhub123` la conoce todo el mundo) | Solo en tu terminal al hacer el seed |
| `SUPABASE_URL` | URL del proyecto, para Storage | Supabase → Project Settings → Data API → *Project URL* | Vercel backend (cuando llegue el bloque B) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servidor de Supabase. **Salta todos los permisos** | Supabase → Project Settings → API Keys → *Secret key* (`sb_secret_…`) o la *service_role* legacy | Vercel backend (bloque B). **Nunca** en el frontend ni en el repo |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Login con GitHub | GitHub → Settings → Developer settings → OAuth Apps | Vercel backend (cuando llegue el OAuth) |

En local, todo esto va en `backend/.env` (está en `.gitignore`). La plantilla es `backend/.env.example`.

## 3. Supabase (una vez)

1. Entra en https://supabase.com/dashboard → **New project**.
   - Nombre: `proy-fullstack`. Región: **Central EU (Frankfurt)**.
   - **Database password:** genera una **solo con letras y números** (los símbolos hay que escaparlos en la URL) y **guárdala**: no se vuelve a mostrar.
2. En el proyecto, pulsa **Connect** (arriba). En *Connection string*, cambia el *Method*:
   - **Transaction pooler** (puerto **6543**) → será tu `DATABASE_URL`. Añádele al final `?uselibpqcompat=true&sslmode=require`.
   - **Session pooler** (puerto **5432**, host `…pooler.supabase.com`) → será tu `DIRECT_URL`. Añádele al final `?sslmode=require`.
   - En las dos, sustituye `[YOUR-PASSWORD]` por la contraseña del paso 1.
   - No uses la *Direct connection* (`db.xxx.supabase.co`): en el plan gratuito solo va por IPv6 y desde casa suele fallar.

   ```
   DATABASE_URL = postgresql://postgres.abcd:CLAVE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?uselibpqcompat=true&sslmode=require
   DIRECT_URL   = postgresql://postgres.abcd:CLAVE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

   > ¿Por qué `uselibpqcompat=true`? La librería `pg` trata `sslmode=require` como "verifica el certificado", y el de Supabase no está en el almacén de Node, así que fallaría con *self-signed certificate*. Con ese parámetro cifra igual que `psql`.

3. Crea las tablas y los datos de demo en Supabase desde tu ordenador. Las variables que pones con `export` ganan al `.env` local, así que no hace falta tocarlo:

   ```bash
   cd backend
   export DIRECT_URL='…session pooler 5432…?sslmode=require'
   export DATABASE_URL='…transaction pooler 6543…?uselibpqcompat=true&sslmode=require'
   export SEED_PASSWORD='otra-que-no-sea-dawhub123'
   npx prisma migrate deploy      # aplica las migraciones (nunca "migrate dev" contra Supabase)
   npx prisma db seed             # OJO: borra y recrea todos los datos
   exit                           # cierra la terminal para olvidar las variables
   ```

   Comprueba en Supabase → **Table Editor** que aparecen las tablas con datos.

## 4. Vercel: proyecto del backend

1. https://vercel.com/new → importa el repo `JavierCagigal/proy-fullstack`.
2. **Project Name:** `proy-fullstack-api`. Así su URL será `https://proy-fullstack-api.vercel.app`, que es la que ya pone `frontend/vercel.json`. Si Vercel te da otra URL, cámbiala en ese archivo.
3. **Root Directory:** `backend`. **Framework Preset:** Express (lo detecta solo). No toques los comandos de build.
4. **Environment Variables:** añade `DATABASE_URL` (la del pooler 6543, con su `?uselibpqcompat=true&sslmode=require`) y `JWT_SECRET` (la salida de `openssl rand -hex 32`). Deja marcados *Production* y *Preview*.
5. **Deploy.**
6. Después, en **Settings**:
   - **Environments → Production → Branch Tracking:** `master`. Por defecto, Vercel usa la rama por defecto del repo (`test`), y nosotros queremos que producción sea `master`.
   - **Functions → Function Region:** **Frankfurt (fra1)**, junto a la BD. Si no, cada consulta cruza el Atlántico.
7. Comprueba que `https://proy-fullstack-api.vercel.app/api/health` responde `{"api":true,"db":true}`.

> Si cambias una variable en Vercel, **no se aplica hasta el siguiente despliegue**. Ve a *Deployments* → ⋯ → **Redeploy**.

## 5. Vercel: proyecto del frontend

1. https://vercel.com/new → el mismo repo otra vez.
2. **Project Name:** `proy-fullstack` (URL `https://proy-fullstack.vercel.app`). **Root Directory:** `frontend`. **Framework Preset:** Vite.
3. **Sin variables de entorno.**
4. **Deploy.** Después, **Settings → Environments → Production → Branch Tracking:** `master`.
5. Abre `https://proy-fullstack.vercel.app`: la home debe decir **API ✅ · BD ✅**. Esa línea prueba la cadena entera: navegador → frontend → rewrite → backend → Supabase.

## 6. Ramas y despliegues

| Rama | Qué despliega Vercel |
|---|---|
| `master` | **Producción** (las URLs de arriba) |
| `test` y las ramas `feat/…`, `fix/…` | *Preview*: una URL temporal por commit (protegida con login de Vercel) |

El frontend de una preview sigue llamando al backend de **producción**, porque el rewrite apunta a una URL fija. Para probar un cambio del backend, hazlo en local o pruébalo después de pasarlo a `master`.

Para pasar a producción: PR `test` → `master` en GitHub y merge. Vercel despliega solo.

## 7. Lo que llegará más adelante

- **Storage (bloque B, ya hecho en el código):**
  1. Supabase → **Storage** → **New bucket**: nombre `recursos`, **Public bucket desactivado** (privado). En *Additional configuration*, **Restrict file size: 20 MB**. Es la segunda barrera: el backend ya valida el tamaño, pero el navegador sube directo a Supabase.
  2. Copia `SUPABASE_URL` (Project Settings → Data API → *Project URL*) y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API Keys → la *service_role* de *Legacy API keys*, o una *Secret key* `sb_secret_…`).
  3. Ponlas en **Vercel** (proyecto `proy-fullstack-api`, Production y Preview) y **redespliega**. Ponlas también en tu `backend/.env` para poder subir archivos en local: en local se usa el mismo bucket.
  4. Sin estas variables todo funciona igual excepto subir y descargar archivos, que dan error.
- **GitHub OAuth:** crea **dos** OAuth Apps (cada una admite un solo *callback*). La de local, con callback `http://localhost:5173/api/auth/github/callback`, y la de producción, con `https://proy-fullstack.vercel.app/api/auth/github/callback`. El callback pasa por el dominio del frontend gracias al rewrite, y así la cookie queda en el dominio bueno. La de producción va en Vercel y la de local, en tu `.env`.

## 8. Antes de la demo

- Supabase **pausa** el proyecto tras 7 días sin actividad. El 10/12, entra en el panel y abre `/api/health`.
- Si cambias el esquema: `npx prisma migrate deploy` contra Supabase (paso 3, sin el seed) **antes** de mergear a `master`.
