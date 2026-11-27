# Registro del proceso de Vibe Coding

Cada entrada: fecha, quién, herramienta, prompt clave, resultado y correcciones manuales.
Los ficheros de instrucciones usados son `AGENTS.md` (reglas comunes) y `CLAUDE.md` (lo importa).

---

## 2026-11-27 · Javier · Claude Code · Planteamiento del proyecto

**Prompt (resumen):** pegar el enunciado y pedir que proponga un portal para profesores y alumnos de DAW (apuntes con control de visibilidad, temas, exámenes, notas, vídeos, proyectos, skills, ofertas de trabajo, GitHub de cada alumno), con pros y contras, y que cree el repositorio.

**Resultado:** repo creado, `docs/PLAN.md` (modelo de datos, roles, stack, alcance, reparto y calendario) y `AGENTS.md` con las reglas para la IA.

**Decisiones de la IA que conviene destacar:** unificar apuntes, vídeos, enlaces, proyectos y skills en una sola tabla `recursos`; autenticación propia en lugar de Supabase Auth para que el backend tenga peso; avisar de que Render duerme el backend en el plan gratuito.
