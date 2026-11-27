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
