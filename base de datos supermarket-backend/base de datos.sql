CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- INSTRUCTORES
-- =========================================================
CREATE TABLE IF NOT EXISTS instructores (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nombre VARCHAR(120) NOT NULL,
	correo VARCHAR(120) NOT NULL UNIQUE,
	hash_contrasena VARCHAR(255) NOT NULL,
	creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SALAS DE JUEGO
-- =========================================================
CREATE TABLE IF NOT EXISTS salas_juego (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_instructor UUID NOT NULL REFERENCES instructores(id) ON DELETE CASCADE,
	codigo VARCHAR(8) NOT NULL UNIQUE,
	nombre VARCHAR(120) NOT NULL,
	activa BOOLEAN NOT NULL DEFAULT TRUE,
	creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salas_instructor
	ON salas_juego(id_instructor);

-- =========================================================
-- APRENDICES
-- =========================================================
CREATE TABLE IF NOT EXISTS aprendices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nombre VARCHAR(120) NOT NULL,
	ficha VARCHAR(7) NOT NULL CHECK (ficha ~ '^[0-9]{7}$'),
	genero VARCHAR(10) NOT NULL CHECK (genero IN ('masculino', 'femenino')),
	hash_contrasena VARCHAR(255) NOT NULL,
	creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizacion para instalaciones existentes que aun tengan codigo_sala:
ALTER TABLE aprendices DROP COLUMN IF EXISTS codigo_sala;

-- Unicidad real de identidad: mismo nombre + misma ficha = mismo aprendiz.
ALTER TABLE aprendices DROP CONSTRAINT IF EXISTS aprendices_ficha_key;
ALTER TABLE aprendices DROP CONSTRAINT IF EXISTS uq_aprendiz_ficha_sala;
ALTER TABLE aprendices DROP CONSTRAINT IF EXISTS uq_aprendices_nombre_ficha;
ALTER TABLE aprendices ADD CONSTRAINT uq_aprendices_nombre_ficha UNIQUE (nombre, ficha);

ALTER TABLE aprendices DROP CONSTRAINT IF EXISTS chk_aprendices_ficha_7_digitos;
ALTER TABLE aprendices
	ADD CONSTRAINT chk_aprendices_ficha_7_digitos
	CHECK (ficha ~ '^[0-9]{7}$');

-- =========================================================
-- PROGRESO DE APRENDICES
-- =========================================================
CREATE TABLE IF NOT EXISTS progreso_aprendices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_aprendiz UUID NOT NULL UNIQUE REFERENCES aprendices(id) ON DELETE CASCADE,
	nivel INTEGER NOT NULL DEFAULT 1,
	dinero NUMERIC(12,2) NOT NULL DEFAULT 50000,
	ventas NUMERIC(12,2) NOT NULL DEFAULT 0,
	salud INTEGER NOT NULL DEFAULT 100,
	hambre INTEGER NOT NULL DEFAULT 20,
	sed INTEGER NOT NULL DEFAULT 100,
	expansiones JSONB NOT NULL DEFAULT '[]',
	actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SESIONES DE APRENDIZ
-- =========================================================
CREATE TABLE IF NOT EXISTS sesiones_aprendiz (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_aprendiz UUID NOT NULL REFERENCES aprendices(id) ON DELETE CASCADE,
	codigo_sala VARCHAR(8) NOT NULL REFERENCES salas_juego(codigo),
	estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada')),
	creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizacion para instalaciones existentes que tengan la
-- restriccion vieja de "una sola sesion en toda su vida":
ALTER TABLE sesiones_aprendiz DROP CONSTRAINT IF EXISTS sesiones_aprendiz_id_aprendiz_key;

-- Restriccion nueva: solo una sesion ACTIVA por aprendiz a la vez.
DROP INDEX IF EXISTS uq_sesion_activa_por_aprendiz;
CREATE UNIQUE INDEX uq_sesion_activa_por_aprendiz
	ON sesiones_aprendiz (id_aprendiz)
	WHERE estado = 'activa';

CREATE INDEX IF NOT EXISTS idx_aprendices_ficha
	ON aprendices(ficha);

CREATE INDEX IF NOT EXISTS idx_sesiones_codigo_sala
	ON sesiones_aprendiz(codigo_sala);

-- =========================================================
-- PERMISOS para el rol de la aplicacion
-- =========================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gr_tourismeasy;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gr_tourismeasy;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO gr_tourismeasy;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO gr_tourismeasy;