---
version: 1
slug: "src-main-ts"
primary_target: "src/main.ts"
related_targets: []
---

# Superficie: la app de Commit (SPA completa)

Modo: Operate. Público: alumnos y profesores de 2º DAW, en portátil en clase (y proyectado en la demo). Tarea: encontrar lo de hoy, consultar recursos de una asignatura, y el profesor publicar y controlar la visibilidad.

## Direction contract

THESIS: Cada asignatura, reto y skill es una pegatina troquelada, como las de la tapa del portátil de un programador; la pegatina es identidad y acceso, nunca adorno. Rechaza el aula virtual de tarjetas con cabecera azul y el gris con un acento.

OWN-WORLD: Rail grafito (#2B2F36) con la marca "commit" como pegatina amarilla girada; suelo aluminio claro (#ECEEF1), paneles blancos, tinta #16181D. Pegatinas: color saturado plano por asignatura, borde blanco de 3-4px, sombra corta, giro de ±3°. Tipos: Bricolage Grotesque 800 para pegatinas y títulos; Figtree para la interfaz. Todo lo que no es pegatina vive en neutros estrictos (raise: Producto monocromo).

STORY: El alumno entra y ve "Hoy": sus asignaturas como pegatinas, lo próximo con su duración exacta y los últimos recursos. El profesor ve lo mismo y además qué está oculto o programado, sin que nada desaparezca.

FIRST VIEWPORT: Rail izquierdo de 248px (marca, navegación, usuario abajo). Cabecera "Hoy, jueves 27" a 38px. Fila de pegatinas de asignatura como accesos. Debajo, panel "Lo próximo" + "Últimos recursos" (columna ancha) y a la derecha el reto activo en negro y "tu portátil" con las pegatinas ganadas.

FORM: Pegatinas del portátil, candidata 6 de 7 de la lista propia. seed:c8a6f1b53ebedbcf. Raises: estados sellados sin desaparecer (Cartera de billetes); estado por forma, no solo color: visible sólido, programado discontinuo, oculto tachado (Riel de espectro); lo próximo siempre arriba con duración exacta (Partitura de danza).

Signature interaction: al publicar un recurso o unirse a un reto, la pegatina "se pega" (scale 1.08 → 1 con giro, 220ms, una vez); respeta prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
