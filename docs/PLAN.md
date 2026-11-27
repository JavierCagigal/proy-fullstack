# DAWHub: plan del proyecto

> Proyecto FullStack con Vibe Coding. Equipo: Javier, Miguel y Alejandro.
> **Exposición: 11 de diciembre de 2026.**
> Este documento es la **fuente de verdad** del proyecto. Recoge lo hablado y decidido con la IA (ver §11). Si algo cambia, se actualiza aquí.

## 1. La idea

Portal para estudiantes y profesores de **informática (DAW/DAM/ASIR)**. No es un Moodle: está pensado para cómo aprende alguien que programa, con proyectos reales, hackathons y GitHub.

- **Asignaturas → temas → recursos**: apuntes (Markdown o archivo), vídeos, enlaces y proyectos. El profesor decide qué es visible y desde cuándo.
- **Evaluaciones y notas**: calendario de exámenes y entregas; el profesor pone las notas y cada alumno ve solo las suyas.
- **Retos / hackathons**: el profesor publica un reto con fechas. Los alumnos forman equipos y entregan su repo y su demo, y la clase vota.
- **Propuestas de proyectos**: cualquier alumno propone una idea (descripción y tecnologías), los demás se apuntan y el profesor puede aprobarla o convertirla en reto.
- **La clase**: perfil de cada alumno con su GitHub y sus proyectos.
- **Skills**: enlaces comunes por categoría (frontend, backend, devops, IA…).
- **Ofertas de trabajo / prácticas**: los alumnos proponen y el profesor aprueba.

## 2. Roles

Hay **3 roles en una sola columna** `usuarios.rol`, con los valores `admin`, `profesor` y `alumno`.

- **admin**: nosotros, los desarrolladores. Gestiona usuarios y roles y puede hacerlo todo.
- **profesor**: gestiona el contenido, las notas y los retos de **sus** asignaturas. Aprueba ofertas y propuestas.
- **alumno**: consume contenido, ve sus notas, forma equipos, vota, propone proyectos y ofertas.

Así se cumple el enunciado: **Administrador** (`admin`) y **Usuario estándar**, que se divide en `profesor` y `alumno`.

> ¿Por qué no dos columnas (`rol_principal` + `rol_usuario`)? Porque permiten combinaciones sin sentido (admin + alumno) y obligan a comprobar dos campos en cada permiso. Con un enum, la base de datos solo admite valores válidos.

Cualquiera que se registre entra como **alumno**. Solo un admin puede ascender a alguien a profesor o a admin. El primer admin se crea con el seed.

| Acción | Alumno | Profesor | Admin |
|---|---|---|---|
| Ver recursos visibles | ✅ | ✅ | ✅ |
| Ver recursos ocultos / programados | ❌ | ✅ (los suyos) | ✅ |
| Crear/editar asignaturas, temas, recursos, archivos | ❌ | ✅ (las suyas) | ✅ |
| Ver notas | solo las suyas | las de sus asignaturas | todas |
| Poner notas | ❌ | ✅ (sus asignaturas) | ✅ |
| Crear retos/hackathons | ❌ | ✅ | ✅ |
| Formar equipo, entregar y votar en un reto | ✅ | ❌ | ❌ |
| Proponer proyecto / apuntarse | ✅ | ✅ | ✅ |
| Aprobar propuestas y ofertas | ❌ | ✅ | ✅ |
| Proponer oferta / skill | ✅ (queda pendiente) | ✅ | ✅ |
| Gestionar usuarios y roles | ❌ | ❌ | ✅ |
| Editar su perfil (GitHub, bio) | ✅ | ✅ | ✅ |

Los permisos se comprueban **siempre en el backend**. El frontend solo oculta botones.

## 3. Archivos (sí, hay subida de archivos)

No pesa para la base de datos, porque **los archivos no se guardan en ella**:

- El archivo va a **Supabase Storage**, un bucket privado. En la BD solo se guarda la ruta (`recursos.archivo_path`), el nombre y el tamaño.
- **Límite que obliga a hacerlo así:** el backend está en Vercel, que no acepta cuerpos de petición de más de **4,5 MB**. Por eso el archivo no pasa por nuestro backend:
  1. El front pide permiso al back: `POST /api/recursos/:id/archivo`. El back comprueba que el usuario es el profesor y devuelve una URL de subida firmada.
  2. El navegador sube el archivo directamente a Supabase con esa URL.
  3. Para descargarlo, el back comprueba la visibilidad y devuelve una URL firmada que caduca en unos minutos. Así un alumno no puede descargar un apunte oculto aunque sepa la ruta.
- Límite propuesto: 20 MB por archivo, y solo PDF, imágenes, ZIP y código. El plan gratuito de Supabase da 1 GB.

## 4. Modelo de datos

```
usuarios           id, nombre, email (único), password_hash (null si entra con GitHub),
                   rol (admin|profesor|alumno), github_id (único, null), github_username,
                   avatar_url, bio, creado_en
asignaturas        id, nombre, curso, profesor_id → usuarios
temas              id, asignatura_id, titulo, orden
recursos           id, tema_id (null = skill/recurso general), tipo (apunte|video|enlace|proyecto|skill),
                   categoria (para skills: frontend|backend|devops|ia|…), titulo, contenido_md, url,
                   archivo_path, archivo_nombre, archivo_bytes, visible (bool),
                   visible_desde (fecha, opcional), autor_id
evaluaciones       id, asignatura_id, titulo, tipo (examen|practica|proyecto), fecha, peso
notas              evaluacion_id + alumno_id (PK), nota, comentario
retos              id, titulo, descripcion_md, inicio, fin, max_miembros, asignatura_id (null), creado_por
equipos            id, reto_id, nombre, repo_url, demo_url, entregado_en
equipo_miembros    equipo_id, reto_id, usuario_id    UNIQUE(reto_id, usuario_id) → un alumno, un equipo por reto
votos              reto_id, equipo_id, usuario_id    UNIQUE(reto_id, usuario_id) → un voto por reto, nunca a tu equipo
propuestas         id, titulo, descripcion_md, tecnologias (text[]), autor_id,
                   estado (abierta|aprobada|descartada), creado_en
propuesta_interes  propuesta_id + usuario_id (PK)
ofertas            id, titulo, empresa, url, ubicacion, tipo (empleo|practicas), autor_id, aprobada (bool)
```

Las reglas que la BD puede garantizar sola (únicos, enums, claves foráneas) van como **restricciones en Prisma**, no como código.

## 5. Stack (decidido)

| Capa | Elección |
|---|---|
| Frontend | **Vite + TypeScript vanilla + Tailwind**. Router propio con History API. |
| Backend | **Node + Express + TypeScript** |
| BD | **PostgreSQL en Supabase**, con **Prisma** como ORM |
| Archivos | **Supabase Storage** (bucket privado + URLs firmadas) |
| Auth | Propia: **bcrypt + JWT en cookie httpOnly**, más **login con GitHub (OAuth2)** |
| Tests | **Vitest** (front y back) + **Supertest** (API) + **Playwright** (E2E) |
| Despliegue | **Vercel** para todo: 2 proyectos de Vercel en el mismo repo (`frontend/` y `backend/`) |
| Local | **`prisma dev`** (Postgres local que trae Prisma, **sin Docker**): `npm run db:local`. Storage sobre el Supabase de desarrollo |

Detalles de despliegue:
- **Mismo origen:** el `vercel.json` del frontend redirige `/api/*` al proyecto del backend. Así la cookie es "first-party" y no la bloquean Safari ni Chrome.
- **Prisma + Supabase en Vercel (serverless):** en ejecución, la URL del pooler (puerto 6543, `pgbouncer=true`); en las migraciones, la conexión directa (puerto 5432).
- **Supabase** pausa el proyecto tras 7 días sin actividad. Basta con entrar al panel. Comprobarlo el día antes de la demo.
- Secretos en las variables de entorno de Vercel y en `.env` local, nunca en el repo. Mantener `.env.example` al día.

## 6. Estructura del repo

```
/frontend    SPA (Vite)
/backend     API Express + Prisma (schema, migraciones y seed)
/e2e         tests de Playwright
/docs        plan y registro del vibe coding
```

Un único `package.json` raíz con **npm workspaces** para lanzar todo con `npm run dev` y `npm test`.

## 7. Pantallas (rutas de la SPA)

`/login` · `/registro` · `/` (panel: próximos exámenes, retos activos, últimos recursos) · `/asignaturas/:id` · `/calendario` · `/notas` · `/retos` · `/retos/:id` · `/propuestas` · `/clase` · `/clase/:id` (perfil) · `/skills` · `/ofertas` · `/admin/usuarios`

## 8. Alcance

**Núcleo (obligatorio):** auth + 3 roles, asignaturas/temas/recursos con visibilidad y archivos, evaluaciones + notas, retos/hackathons, propuestas, clase con GitHub, skills, ofertas, tests y despliegue.

**Opcional que hacemos seguro:** **login con GitHub (OAuth2)**. Rellena solo el `github_username` y el avatar del alumno.

**Opcional sin decidir: funcionalidad con IA.** Requiere llamar a la API de un modelo (Gemini, OpenAI o Claude) con una clave propia; las de pago cobran por uso, y Gemini tiene capa gratuita. Ideas que encajan:
- "Pregúntale a los apuntes": un chat que responde usando los apuntes visibles de la asignatura (aprovecha nuestro ProyectoRAG).
- Revisar propuestas de proyecto: sugiere tecnologías y alcance y detecta duplicados.
- Moderación automática de ofertas.

**Fuera:** foro, notificaciones y chat en tiempo real.

## 9. Reparto (alineado con los deep-dives de 5 min)

| Persona | Bloque | Deep-dive |
|---|---|---|
| A | Backend: auth, JWT, middleware de roles, OAuth GitHub, admin de usuarios | "Login, OAuth con GitHub y control de permisos" |
| B | Frontend: router History API, componentes, layout; asignaturas/recursos con visibilidad y subida de archivos | "Una SPA sin framework + archivos con URLs firmadas" |
| C | Evaluaciones + notas, retos/hackathons (equipos, entregas, votos), propuestas, ofertas | "Cómo funciona un hackathon en DAWHub" |

Cada uno hace los tests de su bloque. Los E2E se reparten por flujo.

## 10. Orden de trabajo

1. Montar el monorepo, el esquema de Prisma y un seed con datos de demo (1 admin, 2 profesores, 6 alumnos, asignaturas reales de DAW).
2. **Desplegar un "hola mundo" en Supabase y en los 2 proyectos de Vercel antes de programar funcionalidades.**
3. Auth + roles, que bloquea todo lo demás.
4. Bloques A/B/C en paralelo, en ramas y con PR.
5. OAuth GitHub.
6. E2E completos, README y `docs/vibe-coding.md`.
7. El 10/12, ensayo de la demo sobre producción.

## 10 bis. Flujo con Git

- `test` es la rama por defecto. Cada funcionalidad va en su rama (`feat/auth`, `feat/retos`…) y se integra con un PR a `test`.
- Vercel: **`master` = producción**; `test` y las ramas generan despliegues de preview para probar.
- Antes de la exposición: PR `test` → `master`.

## 11. Decisiones tomadas y por qué (contexto de la conversación con la IA)

| Tema | Decisión | Motivo |
|---|---|---|
| Idea | Portal de clase para informática, no un Moodle genérico | Retos/hackathons, propuestas de proyecto, GitHub y skills lo hacen único |
| Roles | 3 valores en una columna (`admin`, `profesor`, `alumno`) | admin = desarrolladores; cumple "Administrador + Usuario estándar" |
| Recursos | Una tabla `recursos` con `tipo` | Apuntes, vídeos, enlaces, proyectos y skills en un único CRUD |
| Archivos | Sí, en Supabase Storage con URLs firmadas | La BD solo guarda la ruta; se evita el límite de 4,5 MB de Vercel |
| Auth | Propia (bcrypt + JWT en cookie httpOnly) + GitHub OAuth | Es lo que se evalúa; con Supabase Auth el backend quedaría vacío |
| BD | PostgreSQL en Supabase + Prisma | Gratis, Postgres real, migraciones + seed + Prisma Studio para la demo |
| Despliegue | Todo en Vercel (2 proyectos) | El equipo ya usa Vercel; no duerme como Render |
| Repo | Público, llamado `proy-fullstack` (como la carpeta local) | Lo permite el enunciado y facilita la revisión del profesor |
| Ramas | `test` (por defecto, donde se integra todo) y `master` (lo que se presenta) | Se trabaja en ramas de funcionalidad con PR a `test`; antes de la exposición, `test` → `master` |
| BD local | `prisma dev` en vez de Docker | El equipo no tiene Docker; Prisma trae un Postgres local con un comando |
| IA | Pendiente (ver abajo) | Necesita la API de un proveedor; decidir si merece la pena |

**Pendiente de decidir:** la funcionalidad con IA (§8) y el nombre definitivo (DAWHub es provisional).

**Aclaración sobre la IA (pregunta del equipo: "¿los alumnos tendrían que usar su propia IA?"):**
- Si la integramos, **los alumnos no necesitan nada**: la plataforma llama al modelo con **nuestra** clave de API, guardada en el backend. El coste lo pone la plataforma (con la capa gratuita de Gemini, 0 € para una clase) y se limita el número de mensajes por usuario.
- "Iniciar sesión con su IA" no es viable: no existe un "login con ChatGPT/Claude" que permita a una web usar la suscripción del alumno. La alternativa sería que cada alumno pegara su propia clave de API (de pago, distinta de la suscripción). Mala experiencia y riesgo de seguridad.
- Por tanto, las opciones reales son **integrar una con nuestra clave** o **no hacer IA**. El punto opcional de OAuth ya lo cubrimos con GitHub, así que la IA es un extra.

## 12. Estado actual y siguiente paso

**Hecho (27/11):**
- Monorepo con npm workspaces: `backend/`, `frontend/` y `e2e/`.
- Esquema Prisma completo (§4) con la migración `init` y un seed de demo: admin, 2 profesores, 6 alumnos, asignaturas, notas, un reto con equipos, propuestas y ofertas. Contraseña de todos: `dawhub123`.
- Backend Express: `GET /api/health` comprueba la API y la BD. Exporta la app para Vercel y escucha en el puerto 3000 en local.
- Frontend: router propio (`frontend/src/router.ts`), layout con navegación, home y 404, helpers `api()` y `html()`/`esc()`.
- Tests: Vitest en el backend (Supertest) y en el frontend (router con jsdom), y Playwright (home conectada y navegación SPA sin recarga). Todo en verde.

**Siguiente:**
1. Desplegar el "hola mundo" (necesita las cuentas del equipo): crear el proyecto en Supabase, el proyecto de Vercel del backend (root `backend/`) y el del frontend (root `frontend/`), y poner la URL del backend en `frontend/vercel.json`. Pasos en el README.
2. Bloque A: auth (registro, login, logout, `/api/me`, middleware `requireRol`) + páginas de login y registro.
3. Bloques B y C en paralelo (§9).
