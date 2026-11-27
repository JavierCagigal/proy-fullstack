# DAWHub: plan del proyecto (borrador para decidir en equipo)

> Proyecto FullStack con Vibe Coding. Equipo: Javier, Miguel y Alejandro.
> **Exposición: 11 de diciembre de 2026** (quedan unas 2 semanas desde el 27/11).

## 1. La idea

Portal de clase para estudiantes y profesores de DAW/informática. Reúne en un solo sitio lo que ahora está repartido entre Moodle, Drive, WhatsApp y GitHub:

- **Asignaturas → temas → recursos** (apuntes, vídeos, enlaces, proyectos). El profesor decide qué es visible y desde cuándo.
- **Evaluaciones y notas**: calendario de exámenes y entregas; el profesor pone las notas y cada alumno ve solo las suyas.
- **La clase**: perfil de cada alumno con su GitHub.
- **Skills**: enlaces de interés comunes para toda la clase (roadmaps, cursos, herramientas).
- **Ofertas de trabajo/prácticas**: los alumnos proponen y el profesor aprueba.

Lo que la diferencia de un Moodle: enfocada a DAW (GitHub de cada alumno, skills, ofertas del sector).

## 2. Pros y contras de la idea

| Pros | Contras / riesgos |
|---|---|
| El público de la demo (la clase) son los usuarios: se entiende sin explicarla. | **Alcance**: son ~8 módulos para 2 semanas. Hay que recortar (ver §7). |
| Los roles salen solos (profesor = admin, alumno = usuario) y el control de permisos se ve en la demo: apunte oculto, notas privadas. | Se parece a un "Moodle": hay que vender lo propio de DAW (GitHub, skills, ofertas, IA). |
| Encajan los opcionales: login con GitHub y un asistente IA sobre los apuntes. | Las notas son datos sensibles: los permisos tienen que ser estrictos y estar probados (eso también juega a favor). |
| Da 3 deep-dives individuales claros (ver §8). | Subir ficheros (PDF) complica: al principio, apuntes en Markdown y enlaces. Supabase Storage, después y si sobra tiempo. |

## 3. Modelo de datos (simplificado a propósito)

Apuntes, vídeos, enlaces, proyectos y skills son **una sola tabla `recursos`** con un campo `tipo`. Así 5 "módulos" son un único CRUD.

```
usuarios      id, nombre, email, password_hash (null si entra con GitHub), rol (admin|alumno),
              github_username, creado_en
asignaturas   id, nombre, profesor_id → usuarios
temas         id, asignatura_id, titulo, orden
recursos      id, tema_id (null = recurso general/skill), tipo (apunte|video|enlace|proyecto|skill),
              titulo, contenido_md, url, visible (bool), visible_desde (fecha, opcional), autor_id
evaluaciones  id, asignatura_id, titulo, tipo (examen|practica|proyecto), fecha, peso
notas         evaluacion_id + alumno_id (PK), nota, comentario
ofertas       id, titulo, empresa, url, ubicacion, autor_id, aprobada (bool)
```

## 4. Roles y permisos

El enunciado pide **Administrador y Usuario estándar**. Propuesta: **admin = profesor**, **usuario = alumno**. Basta con una columna `rol`, así que si queremos un tercer rol (admin aparte del profesor) se añade luego sin rehacer nada.

| Acción | Alumno | Profesor/Admin |
|---|---|---|
| Ver recursos visibles | ✅ | ✅ |
| Ver recursos ocultos / programados | ❌ | ✅ |
| Crear/editar asignaturas, temas, recursos | ❌ | ✅ |
| Ver notas | solo las suyas | todas |
| Poner notas | ❌ | ✅ |
| Proponer oferta / skill | ✅ (queda pendiente) | ✅ |
| Aprobar ofertas | ❌ | ✅ |
| Gestionar usuarios y roles | ❌ | ✅ |
| Editar su perfil (GitHub) | ✅ | ✅ |

Los permisos se comprueban **siempre en el backend**. El frontend solo oculta botones.

## 5. Stack propuesto

Ojo, se suelen confundir: **Supabase = base de datos** (PostgreSQL gestionado) y **Vercel = despliegue** (hosting del frontend). El profesor no exige ningún proveedor concreto.

| Capa | Propuesta | Por qué | Alternativa |
|---|---|---|---|
| Frontend | Vite + TypeScript vanilla + Tailwind | Lo que pide el enunciado. Vite solo empaqueta; no es un framework. | Bootstrap en vez de Tailwind |
| Router SPA | Propio con History API (~50 líneas) | Obligatorio que sea nativo, y da para un deep-dive | — |
| Backend | Node + Express + TypeScript | Mismo lenguaje que el front y el que mejor conoce la IA | FastAPI (Python) |
| BD | PostgreSQL en **Supabase** | Gratis, Postgres real y panel web para enseñar los datos | Neon (Vercel Postgres) |
| ORM | Prisma | Migraciones + seed + Prisma Studio para la demo | Drizzle, SQL a pelo con `pg` |
| Auth | Propia: bcrypt + JWT en cookie httpOnly; GitHub OAuth como opcional | Un backend propio con roles es lo que se evalúa. Con Supabase Auth el backend quedaría vacío. | Supabase Auth (menos trabajo, menos nota) |
| Tests | Vitest (front y back) + Supertest (API) + Playwright (E2E) | Una sola herramienta de tests unitarios para todo | Jest, Cypress |
| Deploy front | Vercel | Gratis y despliega solo con cada push | Netlify |
| Deploy back | Render | Servicio Express "de verdad", independiente | Vercel (Express como función) |
| Local | `docker compose` con Postgres | Arranca en local en un comando, para la parte de "despliegue local" | Una BD de Supabase para dev |

Avisos del plan gratuito:
- **Render** duerme el backend tras 15 min sin uso; la primera petición tarda 30-60 s. **Antes de la demo hay que despertarlo**, o desplegar el back en Vercel.
- **Supabase** pausa el proyecto tras 7 días sin actividad. Basta con entrar al panel.
- Front (vercel.app) y back (onrender.com) en dominios distintos: la cookie se bloquearía como "third-party". Solución: un rewrite en Vercel para que `/api/*` apunte al backend, así es mismo origen.

## 6. Pantallas (rutas de la SPA)

`/login` · `/registro` · `/` (panel: próximos exámenes y últimos recursos) · `/asignaturas/:id` · `/calendario` · `/notas` · `/clase` · `/skills` · `/ofertas` · `/admin/usuarios`

## 7. Alcance: qué entra y qué no

**MVP (obligatorio, hasta el 4/12):** auth + roles, asignaturas/temas/recursos con visibilidad, evaluaciones + notas, clase con GitHub, ofertas, tests y despliegue.

**Opcionales (5-7/12, por orden):**
1. **Login con GitHub (OAuth2)**: encaja a la perfección, porque además rellena el GitHub del alumno.
2. **Asistente IA "pregúntale a los apuntes"**: chat que responde usando los apuntes visibles de la asignatura. Aprovechamos lo del ProyectoRAG. Hace falta la API de un LLM (Gemini tiene capa gratuita).

**Fuera:** subida de ficheros, foro, notificaciones y chat en tiempo real.

## 8. Reparto (alineado con los deep-dives de 5 min)

| Persona | Bloque | Deep-dive |
|---|---|---|
| A | Backend: auth, JWT, middleware de roles, OAuth GitHub, admin de usuarios | "Cómo funciona el login y el control de permisos" |
| B | Frontend: router History API, sistema de componentes, layout, recursos con visibilidad | "Una SPA sin framework" |
| C | Evaluaciones + notas, calendario, ofertas, asistente IA | "El asistente IA sobre los apuntes" |

Cada uno hace los tests de su bloque. Los E2E se reparten por flujo.

## 9. Calendario

| Fecha | Hito |
|---|---|
| 27-29 nov | Cerrar decisiones, montar el monorepo, esquema BD + seed y **desplegar un "hola mundo" en las 3 nubes** (pronto, para no llevarnos sustos al final) |
| 30 nov - 4 dic | MVP en paralelo (A/B/C) |
| 5-7 dic | Opcionales: GitHub OAuth e IA |
| 8-9 dic | E2E completos, README y documentación del vibe coding |
| 10 dic | Ensayo de la demo con el despliegue de producción |
| **11 dic** | **Exposición** |

## 10. Decisiones pendientes

1. ¿2 roles (profesor = admin) o 3 (admin, profesor, alumno)?
2. ¿Backend en Render (más "independiente", duerme) o en Vercel (no duerme)?
3. ¿Prisma o Drizzle?
4. ¿Qué opcional(es) atacamos: GitHub OAuth, IA o los dos?
5. ¿Repo público o privado? (Ahora es privado; hay que invitar al profesor o hacerlo público.)
6. Nombre definitivo (DAWHub provisional).
