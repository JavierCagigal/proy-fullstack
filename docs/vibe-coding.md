# Registro del proceso de Vibe Coding

Cada entrada: fecha, quién, herramienta, prompt clave, resultado y correcciones manuales.
Los ficheros de instrucciones usados son `AGENTS.md` (reglas comunes) y `CLAUDE.md` (lo importa).

---

## 2026-11-27 · Javier · Claude Code · Planteamiento del proyecto

**Prompt (resumen):** pegar el enunciado y pedir que proponga un portal para profesores y alumnos de DAW (apuntes con control de visibilidad, temas, exámenes, notas, vídeos, proyectos, skills, ofertas de trabajo, GitHub de cada alumno), con pros y contras, y que cree el repositorio.

**Resultado:** repo creado, `docs/PLAN.md` (modelo de datos, roles, stack, alcance, reparto y calendario) y `AGENTS.md` con las reglas para la IA.

**Decisiones de la IA que conviene destacar:** unificar apuntes, vídeos, enlaces, proyectos y skills en una sola tabla `recursos`; autenticación propia en lugar de Supabase Auth para que el backend tenga peso; avisar de que Render duerme el backend en el plan gratuito.

---

## 2026-11-27 · Javier · Claude Code · Cerrar decisiones

**Prompt (resumen):** respuesta a las preguntas del plan: 3 roles (admin = desarrolladores, profesor y alumno), enfoque en informática con hackathons y propuestas de proyectos, permitir la subida de archivos, Vercel para el backend, Prisma, GitHub OAuth, repo público y dejar todo el contexto en un .md para Antigravity.

**Resultado:** `docs/PLAN.md` reescrito como fuente de verdad (§11 recoge las decisiones con su motivo), con nuevas tablas `retos`, `equipos`, `votos`, `propuestas` y archivos en `recursos`. Regla de Antigravity en `.agent/rules/proyecto.md`.

**Decisiones de la IA que conviene destacar:**
- Una sola columna `rol` en vez de dos (`rol_principal` + `rol_usuario`), porque dos permiten combinaciones inválidas.
- Archivos en Supabase Storage subidos con URL firmada, porque Vercel limita el cuerpo de las peticiones a 4,5 MB.
- Restricciones `UNIQUE` en la BD para "un equipo por reto" y "un voto por reto".

---

## 2026-11-27 · Javier · Claude Code · Ramas, IA y esqueleto del proyecto

**Prompt (resumen):** renombrar el repo a `proy-fullstack`, usar las ramas `master` y `test` (se sube todo a `test` y a `master` antes de presentar), preguntar si la IA obligaría a cada alumno a usar la suya, empezar el desarrollo y dejar el contexto en un .md para Antigravity.

**Resultado:** repo renombrado; `main` → `master` y `test` como rama por defecto. Esqueleto completo: monorepo (npm workspaces), esquema Prisma + migración + seed, API Express con `/api/health`, SPA con router propio, y tests en Vitest y Playwright en verde. `docs/PLAN.md` §12 recoge el estado actual y el siguiente paso.

**Decisiones de la IA que conviene destacar:**
- `prisma dev` en lugar de Docker para la BD local, porque no hay Docker instalado y así basta un comando sin instalar nada más.
- La IA no la tendrían que pagar los alumnos: si se integra, usa la clave de la plataforma. "Iniciar sesión con tu IA" no existe como OAuth. Queda como decisión del equipo.
- Restricciones compuestas en la BD (`EquipoMiembro`/`Voto` → `(equipoId, retoId)`) para que un alumno no pueda estar en dos equipos del mismo reto.
- Prisma fijado en la 7.10.1, porque la etiqueta `latest` de npm apuntaba a una release candidate de la 8.
