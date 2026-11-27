# DAWHub

Portal de clase para profesores y alumnos de informática: apuntes y archivos con control de visibilidad, notas, retos/hackathons, propuestas de proyectos, perfiles con GitHub, skills y ofertas de trabajo.

> 🚧 En desarrollo. Plan, decisiones y estado: [`docs/PLAN.md`](docs/PLAN.md).

## 1. Descripción y características
_Pendiente._

## 2. Puesta en marcha en local

Requisitos: Node 22+ (no hace falta Docker).

```bash
git clone https://github.com/JavierCagigal/proy-fullstack.git && cd proy-fullstack
npm install                          # instala los 3 workspaces y genera el cliente de Prisma
cp backend/.env.example backend/.env
npm run db:local                     # Postgres local (prisma dev) en segundo plano
npm run db:migrate                   # crea las tablas
npm run db:seed                      # datos de demo (contraseña de todos: dawhub123)
npm run dev                          # API en :3000 + web en http://localhost:5173
```

Tests:

```bash
npm test                             # unitarios (backend + frontend)
npx playwright install chromium      # solo la primera vez
npm run test:e2e                     # E2E (arranca la API y la web solos; la BD local tiene que estar en marcha)
```

Si `prisma dev` da otro puerto, cópialo en `DATABASE_URL` y en `DIRECT_URL` del `.env` (con `npx prisma dev ls` lo ves, desde `backend/`).

### Despliegue (Supabase + Vercel)

Paso a paso, qué clave va en cada sitio y cómo se conecta todo: [`docs/despliegue.md`](docs/despliegue.md).

## 3. URLs de producción
| Componente | URL |
|---|---|
| Frontend | _pendiente_ |
| Backend | _pendiente_ |
| Base de datos | Supabase (_pendiente_) |

## 4. Proceso de Vibe Coding
- Reglas para la IA: [`AGENTS.md`](AGENTS.md) (también `CLAUDE.md` y `.agent/rules/` para Antigravity)
- Registro de prompts: [`docs/vibe-coding.md`](docs/vibe-coding.md)
