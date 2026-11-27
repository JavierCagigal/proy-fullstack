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

---

## 2026-11-27 · Javier · Claude Code · Despliegue y bloque A (auth)

**Prompt (resumen):** "empieza con todo, con el nombre de las ramas y con lo que haga falta; pásame los pasos para Supabase y Vercel, qué tokens copio y dónde, y explícame cómo se conecta cada cosa".

**Resultado:**
- PR `chore/despliegue`: `docs/despliegue.md` (arquitectura, tabla de variables y paso a paso), convención de ramas `feat/` `fix/` `docs/` `chore/`, y arreglo del backend para Vercel.
- Rama `feat/auth`: registro, login, logout, `/api/me`, `requireRol`, admin de usuarios, páginas de login, registro y usuarios, y guardia de rutas en el router. Tests unitarios y E2E.

**Decisiones de la IA que conviene destacar:**
- Antes de escribir la guía, **compiló el backend como lo hace Vercel** (`vercel build` en local) y encontró que en producción habría fallado (`ERR_MODULE_NOT_FOUND`): Vercel no empaqueta el backend y Node ESM exige la extensión en los imports. Solución: imports con `.js` y Prisma generando igual. Nueva regla en `AGENTS.md`.
- `pg` trata `sslmode=require` como "verificar el certificado" y el de Supabase no está en Node: la URL de la app lleva `uselibpqcompat=true&sslmode=require`.
- El JWT solo guarda el id del usuario; el rol se lee de la BD en cada petición, así un cambio de rol se aplica sin volver a iniciar sesión.
- La contraseña del seed sale de `SEED_PASSWORD`: el repo es público y `dawhub123` daría acceso de admin en producción.
- El admin no puede cambiarse su propio rol, para que no se quede la app sin admin.

**Qué hubo que corregir:** dos E2E fallaban de forma intermitente: uno por una carrera entre el logout y la siguiente navegación, y otro porque dos registros en paralelo generaban el mismo email con `Date.now()`. Se corrigieron y se ejecutaron 3 veces seguidas en verde.


---

## 2026-11-27 · Javier · Claude Code (+ skill Impeccable) · Bloque B y diseño de toda la interfaz

**Prompt (resumen):** "sigue con el bloque B, usa las skills de /impeccable para hacer toda la UI de la página web".

**Proceso de diseño (Impeccable):**
1. Entrevista de producto: uso principal en portátil, tono cercano (tuteando) y nombre. La IA propuso cuatro nombres (Forja, Aula.dev, Commit, Localhost) y el equipo eligió **Commit**. Queda en `frontend/PRODUCT.md`.
2. La IA hizo una lista de 7 mundos visuales del entorno del alumno (libro de texto de FP, agenda, separadores, plano de metro, cartel suizo, pegatinas del portátil, grafo de git). La herramienta sorteó cuál construir para no caer en el diseño de siempre y propuso alternativas de un catálogo. En una página de decisión con bocetos HTML, el equipo eligió **"Pegatinas del portátil"**: cada asignatura es una pegatina troquelada con su color.
3. Contrato de dirección en `frontend/.impeccable/surfaces/src-main-ts.md`, detector automático de errores de diseño y revisión final hecha por un agente independiente con capturas a 1440 y 390 px.

**Resultado:** API del bloque B (asignaturas, temas, recursos con visibilidad, archivos con URLs firmadas, panel "Hoy") e interfaz rehecha: login, Hoy, Asignaturas, asignatura con temas y recursos, usuarios y 404.

**Decisiones de la IA que conviene destacar:**
- El color y las siglas de cada asignatura se calculan del id y del nombre (DWEC, DAW…), sin columnas nuevas en la BD.
- La descarga de un archivo oculto responde 404, no 403, para no revelar que existe.
- Markdown propio de ~50 líneas en vez de una librería: primero se escapa todo y solo se permiten enlaces `http(s)`. Tiene tests de XSS.
- El borrado se confirma en dos pasos en el propio botón, sin `confirm()`.
- Cada estado de visibilidad se distingue por la forma y no solo por el color (tachado, borde discontinuo), por accesibilidad.

**Qué hubo que corregir:**
- Al limpiar los nombres de archivo, la tilde se convertía en `_` (`versio_n`); lo cazó un test.
- Dos pegatinas salían grises porque Tailwind v4 no genera las variables de tema que solo se usan en estilos en línea (`@theme static`).
- La cabecera de la asignatura se aplastaba en móvil.
- El botón de borrar en dos pasos no anunciaba la confirmación al lector de pantalla; lo descubrió un E2E.
- La revisión final (un agente independiente, solo con capturas y el contrato) **rechazó las primeras capturas móviles**: la ventana de Chrome no baja de 500 px en macOS, así que "390 px" no era real. Rehechas con Playwright a tamaño exacto, salieron 9 problemas que antes no se veían: scroll horizontal en "Hoy", pegatinas apiladas que empujaban "Lo próximo" fuera de pantalla, "Salir" encima del menú, el discontinuo usado para dos estados distintos, un "0 días" en la cuenta atrás… Se corrigieron en dos rondas hasta el veredicto **ship**.
- Al arreglar las pegatinas en móvil se introdujo un fallo de accesibilidad: un `aria-label` que no empezaba por el texto visible (WCAG 2.5.3). La segunda ronda lo cazó.
- **Lección:** para comprobar el diseño en móvil, capturas con Playwright y `viewport` exacto, nunca redimensionando la ventana del navegador.

---

## 2026-11-28 · Javier · Claude Code · Bloque C (notas, retos, propuestas, ofertas)

**Prompt (resumen):** "sigue con el bloque C".

**Resultado:** calendario, notas (vista del alumno con media ponderada y cuaderno del profesor que guarda al salir de cada casilla), retos/hackathons (equipos, entrega de repo y demo, votos), propuestas y ofertas con aprobación, y borrado de usuarios para el admin. Todo con el mismo sistema de diseño (`frontend/DESIGN.md`), sin inventar estilos nuevos. 25 tests de API y 10 E2E.

**Decisiones de la IA que conviene destacar:**
- Las reglas del hackathon se reparten entre la BD (UNIQUE: un equipo y un voto por reto) y la API (no votarte a ti mismo, solo equipos que han entregado, límite de miembros). Un intento duplicado se convierte en un 409 claro, sin comprobar antes en la aplicación.
- Los votos no se muestran a la clase hasta que cierra el reto, para no influir en la votación.
- Borrar a un profesor con asignaturas da 409 en vez de borrar en cascada su contenido.
- La pegatina "¡Estás dentro!" solo se anima al unirte a un equipo, que es el momento firmado del diseño.

**Qué hubo que corregir:**
- Prisma no admite `retoId` en la creación anidada de un miembro con clave compuesta; se pasó a una transacción.
- `prisma dev` (PGlite) cortaba conexiones con tests en paralelo: se pusieron en serie.
- Tres E2E fallaban por los propios tests: `name: 'Salir'` encontraba también "Salir del equipo"; `selectOption` lanzaba `change` aunque el valor no cambiara, y la app recargaba el cuaderno (arreglado en la app); y una nota igual a la que ya había no disparaba `change` (el test usa ahora un valor distinto en cada ejecución).
- El test de registro creaba un usuario nuevo en cada ejecución y nunca lo borraba. Ahora el admin puede borrar usuarios y el test borra el suyo al final.

---

## 2026-11-28 · Javier · Claude Code · La clase y Skills

**Prompt (resumen):** "sigue con la clase y skills".

**Resultado:** "La clase" con un portátil por persona, en el que las pegatinas son las asignaturas que imparte, sus retos y las tecnologías de sus propuestas. Perfil editable (nombre, GitHub, bio) y Skills por categoría con aprobación del profesor. 29 tests de API y 12 E2E.

**Decisiones de la IA que conviene destacar:**
- La revisión de diseño anterior señaló que "la tapa del portátil" solo salía en el login. Ahora es la identidad de cada perfil, y las pegatinas se ganan con datos reales: nada de logros inventados.
- Las pegatinas libres (tecnologías, retos, categorías) derivan su color, giro y troquel del propio texto: "Node" es siempre la misma pegatina en toda la web.
- Las skills reutilizan la tabla `recursos` (`tipo = skill`, sin tema), como decía el plan, y `visible` hace de "aprobada". No hizo falta migración.
- La clase nunca devuelve emails ni admins, y el nombre de usuario de GitHub se valida con su formato real.
- Los avatares pasan a ser neutros, porque el documentador de diseño avisó de que usaban colores de pegatina.
