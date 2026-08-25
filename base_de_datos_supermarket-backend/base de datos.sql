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
-- DEUDAS POR RECUPERACION DE VIDA
-- =========================================================
CREATE TABLE IF NOT EXISTS deudas_aprendices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_aprendiz UUID NOT NULL UNIQUE REFERENCES aprendices(id) ON DELETE CASCADE,
	monto NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
	actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deudas_aprendiz
	ON deudas_aprendices(id_aprendiz);

-- =========================================================
-- BODEGA E INVENTARIO POR APRENDIZ
-- =========================================================
CREATE TABLE IF NOT EXISTS bodegas_aprendices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_aprendiz UUID NOT NULL UNIQUE REFERENCES aprendices(id) ON DELETE CASCADE,
	creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario_bodegas (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_bodega UUID NOT NULL REFERENCES bodegas_aprendices(id) ON DELETE CASCADE,
	id_producto VARCHAR(120) NOT NULL,
	nombre_producto VARCHAR(160) NOT NULL,
	cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
	precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
	actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_inventario_bodega_producto UNIQUE (id_bodega, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_bodegas_aprendiz
	ON bodegas_aprendices(id_aprendiz);

CREATE INDEX IF NOT EXISTS idx_inventario_bodega
	ON inventario_bodegas(id_bodega);

CREATE TABLE IF NOT EXISTS cajas_bodega (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_bodega UUID NOT NULL REFERENCES bodegas_aprendices(id) ON DELETE CASCADE,
	id_producto VARCHAR(120) NOT NULL,
	nombre_producto VARCHAR(160) NOT NULL,
	unidades_por_caja INTEGER NOT NULL CHECK (unidades_por_caja > 0),
	cajas_disponibles INTEGER NOT NULL DEFAULT 0 CHECK (cajas_disponibles >= 0),
	costo_total_caja NUMERIC(12,2) NOT NULL CHECK (costo_total_caja >= 0),
	precio_venta_unidad NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_venta_unidad >= 0),
	actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_caja_bodega_producto UNIQUE (id_bodega, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_cajas_bodega
	ON cajas_bodega(id_bodega);

CREATE TABLE IF NOT EXISTS productos_aprendices (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	id_aprendiz UUID NOT NULL REFERENCES aprendices(id) ON DELETE CASCADE,
	id_producto VARCHAR(120) NOT NULL,
	nombre VARCHAR(160) NOT NULL,
	precio_venta_unidad NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_venta_unidad >= 0),
	actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT uq_producto_aprendiz_codigo UNIQUE (id_aprendiz, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_productos_aprendiz
	ON productos_aprendices(id_aprendiz);

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