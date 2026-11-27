---
name: Commit
description: Portal de clase para gente que aprende a programar; cada asignatura es una pegatina troquelada sobre la tapa de un portátil.
colors:
  tomato: "#ff5a36"
  lemon: "#ffd23f"
  mint: "#2ec4b6"
  lilac: "#b9a6ff"
  pink: "#ff8fc4"
  sky: "#7cc0ff"
  ok: "#17795e"
  danger: "#b4300f"
  danger-soft: "#ffe5de"
  ink: "#16181d"
  muted: "#555b66"
  line: "#e3e6ea"
  ground: "#eceef1"
  surface: "#ffffff"
  wash: "#f1f2f5"
  field-stroke: "#cfd4da"
  hairline: "#d9dde3"
  rail: "#2b2f36"
  rail-2: "#3a3f48"
  rail-text: "#c9ced6"
  rail-muted: "#9aa1ad"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  display-hoy:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
  title:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.4
  sticker:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1
  lead:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  micro:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
rounded:
  code: "5px"
  nav: "8px"
  control: "10px"
  tile: "12px"
  panel: "14px"
  sticker: "16px"
  lid: "24px"
  pill: "999px"
spacing:
  gap-xs: "8px"
  gap-sm: "12px"
  gap-md: "16px"
  panel: "24px"
  section: "32px"
  page-x: "20px"
  page-x-lg: "40px"
  rail: "248px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "#2f333b"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
  button-text:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "6px 8px"
  button-text-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
  sticker:
    textColor: "{colors.ink}"
    typography: "{typography.sticker}"
    rounded: "{rounded.sticker}"
    padding: "12px 16px"
  nav-item:
    textColor: "{colors.rail-text}"
    rounded: "{rounded.nav}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.rail-2}"
    textColor: "{colors.surface}"
  choice-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  choice-pill-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  reto-card:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: Commit

## Overview

**Creative North Star: "La tapa del portátil"**

Commit es la tapa de aluminio del portátil de un programador: una superficie neutra, gris y fría, sobre la que se pegan pegatinas troqueladas de vinilo. Cada asignatura (y, cuando lleguen, cada reto y cada skill) es una pegatina: color plano saturado, borde blanco grueso, una sombra corta y un pequeño giro. La pegatina es identidad y acceso a la vez; nunca es adorno. Todo lo demás (rail, suelo, paneles, texto, botones) vive en neutros estrictos de grafito y aluminio, para que el color signifique siempre "esta asignatura".

La densidad es de herramienta de trabajo, no de folleto: un rail grafito fijo a la izquierda, un suelo de aluminio claro y paneles blancos con listas separadas por líneas finas. La tipografía de cartel (Bricolage Grotesque a 800) se reserva para pegatinas y títulos; la interfaz habla en Figtree, en español y tuteando.

El sistema rechaza el aula virtual de tarjetas con cabecera azul y el gris corporativo con un único acento.

**Key Characteristics:**
- Neutros estrictos (grafito, aluminio, blanco, tinta) como campo; el color saturado solo en pegatinas.
- Pegatinas con color, troquel y giro derivados del id de la asignatura: estables sin guardarlos en la BD.
- Estado de visibilidad legible por la forma, no solo por el color.
- Un único momento de movimiento firmado: lo recién publicado "se pega".
- Iconos de trazo (Lucide, 1.75px) en línea, siempre en `currentColor`.

## Colors

Un campo neutro de grafito y aluminio con seis vinilos saturados que solo aparecen como pegatinas.

### Primary
Los seis vinilos de pegatina. Se asignan por asignatura, ciclando por id (`vinilo(id)` en `src/ui.ts`); nunca se eligen a mano en una página.
- **Tomate** (tomato): vinilo 1; también la pegatina del 404 y el cursor de texto (caret) de los campos.
- **Limón** (lemon): vinilo 2; la pegatina de marca "commit", el color de selección de texto y el halo de foco de los campos y del foco sobre fondos oscuros.
- **Menta** (mint): vinilo 3; la pegatina "¡Estás dentro!" del reto.
- **Lila** (lilac), **Chicle** (pink), **Cielo** (sky): vinilos 4 a 6.

El texto sobre cualquier vinilo es siempre tinta, nunca blanco.

### Secondary
Colores semánticos, apagados y usados en texto, puntos y fondos suaves; nunca como relleno de pegatina.
- **Verde publicado** (ok): punto sólido del estado "Visible" y mensajes de éxito.
- **Óxido** (danger): errores de formulario y el botón de borrado ya armado.
- **Óxido suave** (danger-soft): fondo de la etiqueta "Examen" en "Lo próximo".

### Neutral
- **Tinta** (ink): texto principal, botón primario, la tarjeta de reto activo, contorno de foco y bloques de código.
- **Gris lápiz** (muted): texto secundario, metadatos, números de tema.
- **Aluminio** (ground): el suelo de la app y de la pantalla de acceso.
- **Blanco** (surface): paneles, campos, botón secundario.
- **Lavado** (wash): relleno de casillas de icono, etiquetas neutras, hover de botón de texto, código en línea.
- **Línea** (line): separadores entre filas de lista.
- **Filo** (hairline): la línea inferior de 1px que asienta los paneles y el aro de los chips.
- **Trazo de campo** (field-stroke): borde de campos y botón secundario en reposo.
- **Grafito** (rail) y **Grafito claro** (rail-2): el rail y su estado activo/hover; también el panel de la pantalla de acceso y las cifras de la cuenta atrás.
- **Texto de rail** (rail-text) y **Rail apagado** (rail-muted): texto e iconos sobre grafito.

### Named Rules
**The Una Sola Pegatina de Color Rule.** Las pegatinas troqueladas son lo único saturado de la pantalla. Si un elemento nuevo necesita color y no es una pegatina, usa un neutro o un color semántico.

**The Color Derivado Rule.** El vinilo, el troquel y el giro de una asignatura salen de su id vía `pegatina()`, `chip()` y `vinilo()`. No asignes vinilos a mano ni guardes colores en la base de datos.

## Typography

**Display Font:** Bricolage Grotesque Variable (con Figtree Variable de respaldo), autoalojada con `@fontsource-variable`, siempre a 800.
**Body Font:** Figtree Variable (con system-ui), autoalojada con `@fontsource-variable`.
**Code:** la pila monoespaciada del sistema (ui-monospace, SF Mono, Menlo), solo dentro de apuntes Markdown y del textarea de contenido.

**Character:** Bricolage a 800 tiene el peso y la torpeza simpática de un vinilo cortado; Figtree es limpia y legible a tamaño de interfaz. La primera rotula, la segunda trabaja.

### Hierarchy
- **Display** (800, 36px; 44px en "Hoy" a partir de lg; tracking ajustado): el h1 de cada página.
- **Headline** (800, 24px): títulos de tema y del reto activo.
- **Title** (800, 20px): títulos de sección dentro de paneles ("Lo próximo", "Últimos recursos").
- **Sticker** (800, 18px; 24 a 30px en la pegatina grande de cabecera; line-height 1): el texto de las pegatinas, normalmente las siglas.
- **Lead** (400, 18px, gris lápiz): la frase de resumen bajo el h1.
- **Body** (400, 16px): interfaz y listas. Los apuntes en Markdown limitan la línea a 70ch con interlineado 1.65.
- **Label** (600, 14px): etiquetas de formulario (en negrita semibold), metadatos de recurso y sellos de estado.
- **Micro** (700, 12px): etiquetas tipo píldora ("Examen", "Entrega") y la línea de salud de la API.

Fechas, horas, tablas y cifras usan numerales tabulares.

### Named Rules
**The Rótulo y Trabajo Rule.** Bricolage solo a 800 y solo en pegatinas, h1, h2 y cifras grandes; todo lo que se lee de corrido o se pulsa va en Figtree.

## Layout

En escritorio (lg, 1024px) la app es una rejilla de dos columnas: rail grafito fijo de 248px con alto de pantalla (marca arriba, navegación, usuario y salud de la API abajo) y una columna principal centrada con ancho máximo de 72rem y márgenes de 40px. Por debajo de lg el rail se convierte en una barra superior: pegatina de marca, navegación horizontal desplazable sin iconos y botón de salir; los márgenes bajan a 20px.

El ritmo vertical entre bloques de página es de 32px; entre paneles, 24px; dentro de un panel, 24px de relleno y filas de lista de 12 a 16px separadas por una línea de 1px (sin línea en la primera). "Hoy" usa una columna ancha y un lateral de 340px; la asignatura, un índice de temas pegajoso de 220px y la columna de temas. En móvil las pegatinas muestran solo las siglas (el nombre sigue disponible para lectores de pantalla) para que quepan varias por fila.

La pantalla de acceso se parte en dos (5:6): a la izquierda el grafito con la marca, el lema y la tapa del portátil con su collage de pegatinas (solo en lg); a la derecha el formulario, de 24rem como máximo.

## Elevation & Depth

Sistema casi plano con elevación física solo donde hay un objeto físico. Los paneles no flotan: se asientan con una línea inferior de 1px y una sombra ambiental casi invisible. Las pegatinas sí tienen grosor: una sombra corta y dura de 2px más una difusa, que crece un poco al pasar por encima. El resto de la profundidad la da el contraste de tono (grafito, aluminio, blanco).

### Shadow Vocabulary
- **Asiento de panel** (`box-shadow: 0 1px 0 #d9dde3, 0 1px 3px rgb(22 24 29 / 0.04)`): paneles blancos y la tarjeta "Ver como alumno" (solo la línea).
- **Grosor de pegatina** (`box-shadow: 0 2px 0 rgb(22 24 29 / 0.16), 0 8px 18px rgb(22 24 29 / 0.10)`): toda pegatina en reposo.
- **Pegatina levantada** (`box-shadow: 0 3px 0 rgb(22 24 29 / 0.16), 0 12px 24px rgb(22 24 29 / 0.14)`): hover de una pegatina enlazada.
- **Aro de chip** (`box-shadow: 0 0 0 1px #d9dde3`): borde exterior de los chips y avatares con borde blanco.

### Named Rules
**The Solo lo Pegado Tiene Grosor Rule.** La sombra con desplazamiento duro pertenece al vinilo de las pegatinas. Paneles, botones y campos se quedan planos.

## Shapes

Esquinas suaves y consistentes en la interfaz (10px en controles, 12px en casillas de icono, 14px en paneles) frente a las pegatinas, que son el único sitio con forma variable: cada asignatura tiene su troquel (rectángulo de 16px, píldora, esquinas cruzadas 10/26 y 26/10, 22px, media píldora), siempre con un borde blanco de 4px y un giro de entre -2.5° y 2.5°. Las píldoras completas se usan para etiquetas, sellos de estado y opciones de radio. Los avatares son círculos. Los iconos son trazo redondeado de 1.75px en una caja de 24.

**The Troquel Rule.** Solo las pegatinas giran y solo las pegatinas cambian de silueta. La interfaz está siempre recta.

## Components

### Pegatina (componente firma)
Vinilo plano del color de la asignatura, borde blanco de 4px, troquel y giro según el id, texto en tinta Bricolage 800 (normalmente las siglas, con el nombre completo debajo en Figtree en pantallas sm+).
- **Tamaños:** normal (accesos de "Hoy", 18px) y grande (cabecera de asignatura, 24 a 30px).
- **Hover (si es enlace):** se endereza y crece al 104% con la sombra levantada, 220ms con easing expo.
- **Siempre** se construye con `pegatina()`; la marca "commit" es una pegatina limón girada -3°.
- **Chip:** muestra cuadrada de 14px del vinilo con borde blanco de 2px y aro de filo; identifica la asignatura en listas.

### Buttons
- **Shape:** esquinas de 10px, relleno 9px 16px, Figtree 700, icono de 16px a la izquierda con 8px de separación.
- **Primario:** relleno tinta, texto blanco; hover a un grafito algo más claro.
- **Secundario:** blanco con trazo interior de 1.5px del trazo de campo; en hover el trazo pasa a tinta.
- **Texto:** sin fondo, gris lápiz, 6px 8px; hover con lavado y texto tinta. Lo usan las acciones de icono de temas y recursos.
- **Peligro:** relleno óxido, texto blanco. No es un botón en reposo: es el estado "armado" del borrado en dos pasos (el primer clic cambia la etiqueta a la pregunta de confirmación durante 4s).
- **Active / Disabled:** bajan 1px al pulsar; deshabilitados al 55% de opacidad.

### Opciones (radio en píldora)
Píldoras blancas con trazo interior de 1.5px; la marcada se rellena de tinta con texto blanco. Se usan para el tipo de recurso y para "¿Quién lo ve?".

### Cards / Containers
- **Panel:** blanco, esquinas de 14px, asiento de panel, 24px de relleno (20px en formularios compactos).
- **Formulario en línea:** lavado algo más claro (#f5f6f8), esquinas de 12px, 20px de relleno, dentro del panel del tema.
- **Reto activo:** la única tarjeta oscura: tinta, texto blanco, cifras de la cuenta atrás en casillas grafito de 10px.

### Inputs / Fields
- **Style:** blanco, trazo de 1.5px del trazo de campo, esquinas de 10px, 9px 12px, 6px por debajo de su etiqueta semibold. Placeholder en un gris medio legible.
- **Focus:** el trazo pasa a tinta y aparece un halo limón de 3px al 60%.
- **Error:** mensaje en óxido bajo el formulario (`role="alert"`), no se tiñe el campo.
- **Archivo:** el botón nativo de archivo se viste de botón primario pequeño.

### Navigation
Rail grafito. Elementos en Figtree 500 con icono de 18px, 10px 12px, esquinas de 8px; hover y página actual (`aria-current`) con grafito claro y texto blanco. Abajo, avatar circular con la inicial, nombre, rol y la línea de salud de la API. En móvil, barra superior con navegación horizontal sin iconos.

### Recurso y sus estados de visibilidad
Fila de lista con casilla de icono de 40px, título semibold, metadatos en gris lápiz y acciones a la derecha. El profesor ve los tres estados en pantalla y los distingue por la forma:
- **Visible:** punto sólido verde y "Visible"; casilla de icono con lavado.
- **Programado:** sello en píldora con borde discontinuo de tinta, reloj y "Se publica en X · fecha"; casilla de icono con borde discontinuo de 2px y sin relleno.
- **Oculto:** sello en píldora con borde sólido gris lápiz, ojo tachado y "Oculto"; título tachado (decoración de 2px); casilla de icono apagada.

"Ver como alumno" es una casilla en el índice de temas que oculta los recursos no publicados y las herramientas del profesor sin recargar.

### Prosa (apuntes en Markdown)
70ch de ancho, interlineado 1.65, subtítulos en Bricolage 800, enlaces subrayados semibold, código en línea sobre lavado con esquinas de 5px y bloques de código en tinta con esquinas de 10px.

### Movimiento: "se pega"
Lo recién creado (tema o recurso) entra una sola vez desde 106% y -2° hasta su sitio con una sombra que se asienta, 320ms con easing expo (`cubic-bezier(0.16, 1, 0.3, 1)`). Con `prefers-reduced-motion` no hay animación ni giros de hover.

## Do's and Don'ts

### Do:
- **Do** construye cualquier aparición de una asignatura con `pegatina()` o `chip()` de `src/ui.ts`, para que vinilo, troquel y giro sean los mismos en todas partes.
- **Do** mantén lo oculto y lo programado en la pantalla del profesor, distinguibles por forma: punto sólido (visible), píldora y casilla discontinuas (programado), tachado y casilla apagada (oculto). Solo "Ver como alumno" los retira.
- **Do** reutiliza las clases de panel, campo y botón (primario, secundario, texto) antes de escribir utilidades nuevas, y los tokens de color del tema antes que cualquier hex suelto.
- **Do** escribe la interfaz en español y tuteando ("Inicia sesión", "Añadir recurso", "Pulsa otra vez").
- **Do** usa iconos del conjunto `icono()` (trazo Lucide de 1.75px en `currentColor`); si falta uno, añade sus trazos al mapa.
- **Do** muestra fechas con `cuando()`, `fechaCorta()` y `fechaHora()`, y cifras con numerales tabulares.
- **Do** respeta `prefers-reduced-motion` en todo lo que gire o se anime.

### Don't:
- **Don't** uses un vinilo como fondo de botón, cabecera, banda o panel: el color saturado es de las pegatinas.
- **Don't** pongas texto blanco sobre un vinilo.
- **Don't** gires ni cambies la silueta de nada que no sea una pegatina.
- **Don't** hagas desaparecer un recurso no publicado de la vista del profesor ni lo indiques solo con color.
- **Don't** traigas React, Vue, Svelte, Lit ni librerías de componentes o iconos: el frontend es TypeScript vanilla con Tailwind v4 (regla del curso).
- **Don't** cargues fuentes desde una CDN ni uses una fuente del sistema en títulos: Bricolage y Figtree van autoalojadas con `@fontsource-variable`.
- **Don't** construyas un aula virtual de tarjetas con cabecera de color ni una interfaz gris con un único acento.
