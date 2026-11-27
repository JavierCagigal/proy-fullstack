# Instrucciones para los asistentes de IA (Antigravity, Claude, Copilot…)

Este fichero es la "directriz" del proyecto y forma parte de la entrega (trazabilidad del vibe coding). Si cambias una regla, anótalo en `docs/vibe-coding.md`.

## Proyecto
DAWHub: portal de clase para profesores y alumnos de DAW. El plan y el alcance están en `docs/PLAN.md`; léelo antes de proponer funcionalidades.

## Reglas duras (las impone el enunciado)
- Frontend en **TypeScript vanilla**. Prohibido React, Vue, Angular, Svelte, Lit o cualquier librería de componentes o router. Solo se permite CSS (Tailwind).
- Navegación **SPA con History API** y router propio. Nada de recargas de página completas.
- Backend independiente con su propia API REST. Los permisos se validan **siempre en el backend**.
- Toda funcionalidad nueva lleva tests: unitarios (Vitest) y, si es un flujo de usuario, E2E (Playwright).

## Estilo
- Código y comentarios en inglés; textos de la interfaz, commits y documentación en español.
- Lo más simple que funcione. Sin abstracciones "por si acaso" ni dependencias para lo que se hace en pocas líneas.
- Nunca subir secretos: van en `.env` (ignorado). Mantener `.env.example` al día.

## Flujo de trabajo
- Una rama por funcionalidad y PR a `main`; no hacer push directo a `main`.
- Al terminar una tarea con IA, añadir una entrada en `docs/vibe-coding.md` (prompt clave, herramienta, qué salió bien y qué hubo que corregir).
