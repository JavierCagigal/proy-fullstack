# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Alumnos de informática** (DAW/DAM/ASIR): consultan apuntes y recursos de sus asignaturas, ven sus notas y fechas, forman equipos en retos/hackathons, proponen proyectos y comparten su GitHub.
- **Profesores**: publican y ordenan el contenido de sus asignaturas, deciden qué es visible y desde cuándo, ponen notas, lanzan retos y aprueban propuestas y ofertas.
- **Admin** (el equipo que desarrolla la plataforma): gestiona usuarios y roles.

Se usa **sobre todo en portátil**, en clase (y proyectado en la exposición del 11/12/2026). En móvil tiene que funcionar bien, pero no es el caso principal.

## Product Purpose
Portal de clase para gente que aprende a programar. Reúne en un sitio el contenido de las asignaturas (con control de visibilidad), las notas, los retos y los proyectos de la clase. Éxito: que el alumno encuentre lo que necesita para la clase de hoy en segundos y que el profesor publique sin fricción.

## Positioning
No es un Moodle genérico: está pensado para cómo trabaja un programador. Retos/hackathons con equipos, entregas con repo y demo y votación; propuestas de proyectos; el GitHub de cada alumno; skills por categoría.

## Operating Context
- Proyecto de clase del equipo Javier, Miguel y Alejandro (DAW), presentado el 11/12/2026.
- Roles en una sola columna: `admin`, `profesor`, `alumno`. Los permisos se comprueban en el backend; la interfaz solo oculta.
- Datos de demo: 1 admin, 2 profesores (Ana, Luis), 6 alumnos y asignaturas reales de 2º DAW.

## Capabilities and Constraints
- SPA en **TypeScript vanilla + Tailwind**, sin frameworks ni librerías de componentes (lo exige el enunciado). Router propio con History API.
- Archivos en Supabase Storage con URLs firmadas (máx. 20 MB: PDF, imágenes, ZIP y código).
- Fuera de alcance: foro, notificaciones y chat en tiempo real.
- Sin decidir: funcionalidad con IA.

## Brand Commitments
- **Nombre: Commit** (elegido el 27/11/2026, sustituye a "DAWHub"). Juego de palabras: lo que hace un programador cada día y el compromiso que se pide al alumno.
- **Tono: cercano, tuteando** ("Inicia sesión", "Regístrate", "No tienes permiso"). Interfaz en español.

## Evidence on Hand
Solo datos de demo del seed (`backend/prisma/seed.ts`). No hay logos, testimonios, métricas ni usuarios reales: no inventarlos.

## Product Principles
1. Lo de hoy primero: lo próximo (entregas, retos activos, últimos recursos) antes que el archivo completo.
2. Cada rol ve su herramienta: el alumno consume y participa; el profesor publica y controla; nadie ve botones que no puede usar.
3. Lenguaje y costumbres de programador (repos, commits, demos), sin disfrazar la plataforma de juguete.
4. La visibilidad siempre es explícita: el profesor sabe en todo momento qué ve el alumno.

## Accessibility & Inclusion
Sin requisitos específicos confirmados. Mínimo WCAG 2.1 AA (contraste, foco visible, formularios etiquetados, navegación por teclado).
