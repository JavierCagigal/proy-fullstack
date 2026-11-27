-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'profesor', 'alumno');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('apunte', 'video', 'enlace', 'proyecto', 'skill');

-- CreateEnum
CREATE TYPE "TipoEvaluacion" AS ENUM ('examen', 'practica', 'proyecto');

-- CreateEnum
CREATE TYPE "EstadoPropuesta" AS ENUM ('abierta', 'aprobada', 'descartada');

-- CreateEnum
CREATE TYPE "TipoOferta" AS ENUM ('empleo', 'practicas');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'alumno',
    "githubId" TEXT,
    "githubUsername" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignatura" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "profesorId" INTEGER NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" SERIAL NOT NULL,
    "asignaturaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" SERIAL NOT NULL,
    "temaId" INTEGER,
    "tipo" "TipoRecurso" NOT NULL,
    "categoria" TEXT,
    "titulo" TEXT NOT NULL,
    "contenidoMd" TEXT,
    "url" TEXT,
    "archivoPath" TEXT,
    "archivoNombre" TEXT,
    "archivoBytes" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "visibleDesde" TIMESTAMP(3),
    "autorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" SERIAL NOT NULL,
    "asignaturaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvaluacion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "evaluacionId" INTEGER NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("evaluacionId","alumnoId")
);

-- CreateTable
CREATE TABLE "Reto" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcionMd" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "maxMiembros" INTEGER NOT NULL DEFAULT 4,
    "asignaturaId" INTEGER,
    "creadoPorId" INTEGER NOT NULL,

    CONSTRAINT "Reto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" SERIAL NOT NULL,
    "retoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "entregadoEn" TIMESTAMP(3),

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipoMiembro" (
    "equipoId" INTEGER NOT NULL,
    "retoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "EquipoMiembro_pkey" PRIMARY KEY ("equipoId","usuarioId")
);

-- CreateTable
CREATE TABLE "Voto" (
    "retoId" INTEGER NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("retoId","usuarioId")
);

-- CreateTable
CREATE TABLE "Propuesta" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcionMd" TEXT NOT NULL,
    "tecnologias" TEXT[],
    "autorId" INTEGER NOT NULL,
    "estado" "EstadoPropuesta" NOT NULL DEFAULT 'abierta',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Propuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropuestaInteres" (
    "propuestaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "PropuestaInteres_pkey" PRIMARY KEY ("propuestaId","usuarioId")
);

-- CreateTable
CREATE TABLE "Oferta" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ubicacion" TEXT,
    "tipo" "TipoOferta" NOT NULL,
    "autorId" INTEGER NOT NULL,
    "aprobada" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_githubId_key" ON "Usuario"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_retoId_nombre_key" ON "Equipo"("retoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_id_retoId_key" ON "Equipo"("id", "retoId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoMiembro_retoId_usuarioId_key" ON "EquipoMiembro"("retoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Asignatura" ADD CONSTRAINT "Asignatura_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reto" ADD CONSTRAINT "Reto_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reto" ADD CONSTRAINT "Reto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_retoId_fkey" FOREIGN KEY ("retoId") REFERENCES "Reto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoMiembro" ADD CONSTRAINT "EquipoMiembro_equipoId_retoId_fkey" FOREIGN KEY ("equipoId", "retoId") REFERENCES "Equipo"("id", "retoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoMiembro" ADD CONSTRAINT "EquipoMiembro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_equipoId_retoId_fkey" FOREIGN KEY ("equipoId", "retoId") REFERENCES "Equipo"("id", "retoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propuesta" ADD CONSTRAINT "Propuesta_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaInteres" ADD CONSTRAINT "PropuestaInteres_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "Propuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropuestaInteres" ADD CONSTRAINT "PropuestaInteres_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
