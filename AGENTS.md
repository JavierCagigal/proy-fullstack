# Instrucciones para los asistentes de IA (Antigravity, Claude, Copilot…)

Este fichero es la "directriz" del proyecto y forma parte de la entrega (trazabilidad del vibe coding). Si cambias una regla, anótalo en `docs/vibe-coding.md`.

## Proyecto
DAWHub: portal de clase para profesores y alumnos de informática (recursos con visibilidad, notas, retos/hackathons, propuestas de proyectos, GitHub de cada alumno, skills y ofertas).
**Lee `docs/PLAN.md` antes de hacer nada.** Es la fuente de verdad: recoge las decisiones tomadas, el modelo de datos, los roles, el stack y el reparto. No cambies una decisión de su §11 sin preguntar.

Stack: Vite + TS vanilla + Tailwind · Express + TS · PostgreSQL (Supabase) + Prisma · Supabase Storage · Vitest + Supertest + Playwright · Vercel (2 proyectos) · npm workspaces.
Roles: `admin` (desarrolladores), `profesor` y `alumno`, en una sola columna enum.

## Reglas duras (las impone el enunciado)
- Frontend en **TypeScript vanilla**. Prohibido React, Vue, Angular, Svelte, Lit o cualquier librería de componentes o router. Solo se permite CSS (Tailwind).
- Navegación **SPA con History API** y router propio. Nada de recargas de página completas.
- Backend independiente con su propia API REST. Los permisos se validan **siempre en el backend**.
- Toda funcionalidad nueva lleva tests: unitarios (Vitest) y, si es un flujo de usuario, E2E (Playwright).

## Estilo
- Nombres del dominio (modelos, campos, rutas de la API y de la SPA) en español, como en `docs/PLAN.md`. El resto del código, en inglés. Interfaz, commits y documentación, en español.
- Frontend: cada página es una función que devuelve un `HTMLElement` (ver `frontend/src/pages/`). Usa `html()` para crear elementos y `esc()` para todo dato de usuario (evita XSS) y `api()` para llamar al backend.
- Lo más simple que funcione. Sin abstracciones "por si acaso" ni dependencias para lo que se hace en pocas líneas.
- Nunca subir secretos: van en `.env` (ignorado). Mantener `.env.example` al día.

## Flujo de trabajo
- Ramas: `test` es la de integración (por defecto) y `master` la de producción/presentación. Una rama por funcionalidad con PR a `test`. Nunca hacer push directo a `master`.
- Antes de dar algo por terminado: `npm test` y `npm run test:e2e` en verde.
- Al terminar una tarea con IA, añadir una entrada en `docs/vibe-coding.md` (prompt clave, herramienta, qué salió bien y qué hubo que corregir).
