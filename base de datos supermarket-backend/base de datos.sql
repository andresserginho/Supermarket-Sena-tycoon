-- =============================================================================
-- PROYECTO: METAVERSO SENA - SUPERMARKET & LIFE SIMULATOR 3D (ERP + RPG)
-- DESCRIPCIÓN: Esquema Definitivo Completo (30 Tablas + Índices + Seed Inicial)
-- MOTOR: PostgreSQL 14+
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. LIMPIEZA INICIAL DE ESQUEMA (CASCADE)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS jugador_posicion_mundo CASCADE;
DROP TABLE IF EXISTS casa_jugador_muebles CASCADE;
DROP TABLE IF EXISTS mundo_objetos_desplegados CASCADE;
DROP TABLE IF EXISTS mapa_edificios_exteriores CASCADE;
DROP TABLE IF EXISTS regulacion_multas CASCADE;
DROP TABLE IF EXISTS remodelacion_tienda CASCADE;
DROP TABLE IF EXISTS logros_desbloqueados CASCADE;
DROP TABLE IF EXISTS logros CASCADE;
DROP TABLE IF EXISTS prestamos_bancarios CASCADE;
DROP TABLE IF EXISTS jugador_necesidades CASCADE;
DROP TABLE IF EXISTS jugador_perfil CASCADE;
DROP TABLE IF EXISTS usuarios_autenticacion CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS camaras_seguridad_3d CASCADE;
DROP TABLE IF EXISTS robos_mermas_incidentes CASCADE;
DROP TABLE IF EXISTS turnos_laborales CASCADE;
DROP TABLE IF EXISTS empleados_contratos CASCADE;
DROP TABLE IF EXISTS opiniones_resenas CASCADE;
DROP TABLE IF EXISTS carritos_compra_bot CASCADE;
DROP TABLE IF EXISTS npcs_estados_ia CASCADE;
DROP TABLE IF EXISTS npcs_perfiles CASCADE;
DROP TABLE IF EXISTS libro_diario_contable CASCADE;
DROP TABLE IF EXISTS ventas_detalle CASCADE;
DROP TABLE IF EXISTS ventas_encabezado CASCADE;
DROP TABLE IF EXISTS equipos_mantenimiento CASCADE;
DROP TABLE IF EXISTS estantes_repisas CASCADE;
DROP TABLE IF EXISTS gondolas_3d CASCADE;
DROP TABLE IF EXISTS cajas_registradoras CASCADE;
DROP TABLE IF EXISTS lotes_vencimiento CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS secciones CASCADE;
DROP TABLE IF EXISTS recepcion_flete CASCADE;
DROP TABLE IF EXISTS ordenes_compra_detalle CASCADE;
DROP TABLE IF EXISTS ordenes_compra CASCADE;
DROP TABLE IF EXISTS contratos_proveedor CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS config_simulacion CASCADE;

-- -----------------------------------------------------------------------------
-- 1. AUTENTICACIÓN, CUENTAS Y GUARDADO DE PROGRESO
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios_autenticacion (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),                      -- Null si usa Google OAuth
    google_id VARCHAR(255) UNIQUE,                    -- ID Google OAuth
    metodo_registro VARCHAR(20) DEFAULT 'EMAIL' CHECK (metodo_registro IN ('EMAIL', 'GOOGLE')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios_autenticacion(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    detalles JSONB,
    ip_origen VARCHAR(45),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. JUGADOR: PERFIL, PROGRESIÓN, OUTFIT Y NECESIDADES (SIMS MODE)
-- -----------------------------------------------------------------------------
CREATE TABLE jugador_perfil (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES usuarios_autenticacion(id) ON DELETE CASCADE,
    nombre_jugador VARCHAR(100) NOT NULL,
    genero VARCHAR(10) CHECK (genero IN ('HOMBRE', 'MUJER')),
    outfit_equipado VARCHAR(50) DEFAULT 'POLO_NEGRA_SENA_JEAN',
    nivel INT DEFAULT 1 CHECK (nivel >= 1),
    experiencia_xp INT DEFAULT 0 CHECK (experiencia_xp >= 0),
    dinero_cop DECIMAL(15,2) DEFAULT 0.00,                      -- Pesos Colombianos
    nivel_tienda_tamano VARCHAR(30) DEFAULT 'TIENDA_BARRIO' CHECK (nivel_tienda_tamano IN ('TIENDA_BARRIO', 'MINIMARKET', 'SUPERMERCADO_D1')),
    piso_2_desbloqueado BOOLEAN DEFAULT FALSE,                  -- Casa/Habitación
    en_tutorial BOOLEAN DEFAULT TRUE,                           -- Tutorial interactivo activo
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jugador_necesidades (
    id SERIAL PRIMARY KEY,
    jugador_id INT UNIQUE REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    hambre NUMERIC(5,2) DEFAULT 100.00 CHECK (hambre BETWEEN 0 AND 100),
    sueño NUMERIC(5,2) DEFAULT 100.00 CHECK (sueño BETWEEN 0 AND 100),
    higiene NUMERIC(5,2) DEFAULT 100.00 CHECK (higiene BETWEEN 0 AND 100),
    vejiga NUMERIC(5,2) DEFAULT 100.00 CHECK (vejiga BETWEEN 0 AND 100),
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. ECONOMÍA COLOMBIANA: PRÉSTAMO BANCARIO
-- -----------------------------------------------------------------------------
CREATE TABLE prestamos_bancarios (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    banco_nombre VARCHAR(100) DEFAULT 'Banco Didáctico SENA',
    monto_prestado_cop DECIMAL(15,2) NOT NULL DEFAULT 10000000.00, -- 10M COP
    monto_restante_cop DECIMAL(15,2) NOT NULL,
    tasa_interes_diaria NUMERIC(5,4) DEFAULT 0.0015,
    total_cuotas INT DEFAULT 30,
    cuotas_pagadas INT DEFAULT 0,
    monto_cuota_diaria DECIMAL(12,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'PAGADO', 'EN_MORA', 'BANCARROTA_EMBARGO')),
    fecha_proximo_pago TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- 4. LOGROS Y DESBLOQUEOS POR NIVEL
-- -----------------------------------------------------------------------------
CREATE TABLE logros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_requerido INT DEFAULT 1,
    recompensa_cop DECIMAL(12,2) DEFAULT 0.00,
    recompensa_xp INT DEFAULT 100,
    icono_url VARCHAR(255)
);

CREATE TABLE logros_desbloqueados (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    logro_id INT REFERENCES logros(id) ON DELETE CASCADE,
    fecha_desbloqueo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. CONFIGURACIÓN DEL MUNDO, CLIMA Y ENTORNO 3D
-- -----------------------------------------------------------------------------
CREATE TABLE config_simulacion (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    nombre_tienda VARCHAR(100) DEFAULT 'Supermercado SENA',
    hora_simulada TIME NOT NULL DEFAULT '08:00:00',
    dia_simulado INT DEFAULT 1,
    factor_velocidad INT DEFAULT 60, -- 1 seg real = 1 min en juego
    clima VARCHAR(20) DEFAULT 'SOLEADO' CHECK (clima IN ('SOLEADO', 'LLUVIOSO', 'NUBLADO')),
    temperatura_ambiente_c NUMERIC(4,1) DEFAULT 22.5
);

CREATE TABLE mapa_edificios_exteriores (
    id SERIAL PRIMARY KEY,
    codigo_identificador VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'CASA_IZQ_01', 'LOCAL_DER_02'
    tipo VARCHAR(30) DEFAULT 'DECORATIVO_NO_ENTRABLE',
    es_entrable BOOLEAN DEFAULT FALSE,
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    posicion_z NUMERIC(6,2) NOT NULL,
    modelo_glb_path VARCHAR(255) NOT NULL
);

CREATE TABLE remodelacion_tienda (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    textura_paredes VARCHAR(100) DEFAULT 'PARED_BLANCA_BASIC',
    textura_baldosas VARCHAR(100) DEFAULT 'BALDOSA_GRIS_COMERCIAL',
    color_fachada_hex VARCHAR(7) DEFAULT '#39A900',
    area_m2 INT DEFAULT 50,
    iluminacion_tipo VARCHAR(50) DEFAULT 'BOMBILLO_BASICO'
);

-- -----------------------------------------------------------------------------
-- 6. OBJETOS, MUEBLES Y PERSISTENCIA DE POSICIÓN 3D
-- -----------------------------------------------------------------------------
CREATE TABLE mundo_objetos_desplegados (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    tipo_objeto VARCHAR(50) NOT NULL,               -- Ej: 'CAJA_MERCANCIA_CERRADA'
    producto_contenido_id INT,
    cantidad_contenido INT DEFAULT 0,
    ubicacion_entorno VARCHAR(20) DEFAULT 'CALLE' CHECK (ubicacion_entorno IN ('CALLE', 'DENTRO_TIENDA', 'BODEGA', 'CASA_PISO_2')),
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) NOT NULL,
    posicion_z NUMERIC(6,2) NOT NULL,
    rotacion_y NUMERIC(5,2) DEFAULT 0.00
);

CREATE TABLE casa_jugador_muebles (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    mueble_tipo VARCHAR(50) NOT NULL,               -- Ej: 'CAMA_MATRIMONIAL', 'INODORO'
    accion_asociada VARCHAR(30) NOT NULL,            -- Ej: 'DORMIR', 'USAR_BAÑO'
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) NOT NULL,
    posicion_z NUMERIC(6,2) NOT NULL,
    rotacion_y NUMERIC(5,2) DEFAULT 0.00
);

CREATE TABLE jugador_posicion_mundo (
    id SERIAL PRIMARY KEY,
    jugador_id INT UNIQUE REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    zona_actual VARCHAR(30) DEFAULT 'CALLE_EXTERIOR' CHECK (zona_actual IN ('CALLE_EXTERIOR', 'TIENDA_INTERIOR', 'CASA_PISO_2')),
    posicion_x NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    posicion_y NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    posicion_z NUMERIC(6,2) NOT NULL DEFAULT 5.00,
    rotacion_y NUMERIC(5,2) DEFAULT 0.00,
    ultima_sincronizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. LOGÍSTICA DE CADENA DE SUMINISTRO
-- -----------------------------------------------------------------------------
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    nit VARCHAR(30) UNIQUE NOT NULL,
    calificacion_confiabilidad NUMERIC(3,2) DEFAULT 5.00 CHECK (calificacion_confiabilidad BETWEEN 0 AND 5),
    tiempo_promedio_entrega_min INT DEFAULT 10
);

CREATE TABLE contratos_proveedor (
    id SERIAL PRIMARY KEY,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE CASCADE,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0.00,
    costo_flete_fijo DECIMAL(10,2) DEFAULT 15000.00,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    proveedor_id INT REFERENCES proveedores(id),
    total DECIMAL(12,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'DESPACHADO', 'EN_BODEGA', 'CANCELADO')),
    fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. INVENTARIO REALISTA Y PRODUCTOS
-- -----------------------------------------------------------------------------
CREATE TABLE secciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color_hex VARCHAR(7) DEFAULT '#39A900',
    requiere_refrigeracion BOOLEAN DEFAULT FALSE,
    temperatura_ideal_c NUMERIC(4,1) DEFAULT 20.0
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    seccion_id INT REFERENCES secciones(id),
    nombre VARCHAR(150) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    precio_venta DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
    costo_base DECIMAL(12,2) NOT NULL CHECK (costo_base >= 0),
    iva_porcentaje NUMERIC(5,2) DEFAULT 19.00,
    alto_m NUMERIC(4,2) DEFAULT 0.20,
    ancho_m NUMERIC(4,2) DEFAULT 0.15,
    profundo_m NUMERIC(4,2) DEFAULT 0.10,
    imagen_textura_url TEXT NOT NULL,
    modelo_3d_url TEXT,
    stock_bodega INT DEFAULT 0 CHECK (stock_bodega >= 0),
    stock_piso_exhibicion INT DEFAULT 0 CHECK (stock_piso_exhibicion >= 0),
    nivel_desbloqueo INT DEFAULT 1
);

CREATE TABLE ordenes_compra_detalle (
    id SERIAL PRIMARY KEY,
    orden_id INT REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad_solicitada INT NOT NULL CHECK (cantidad_solicitada > 0),
    precio_unitario DECIMAL(12,2) NOT NULL
);

CREATE TABLE recepcion_flete (
    id SERIAL PRIMARY KEY,
    orden_id INT REFERENCES ordenes_compra(id),
    cantidad_recibida_ok INT NOT NULL,
    cantidad_dañada INT DEFAULT 0,
    observaciones TEXT,
    fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lotes_vencimiento (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    cantidad_restante INT NOT NULL CHECK (cantidad_restante >= 0),
    fecha_vencimiento DATE NOT NULL,
    estado_calidad VARCHAR(20) DEFAULT 'FRESCO' CHECK (estado_calidad IN ('FRESCO', 'POR_VENCER', 'VENCIDO_DESECHABLE'))
);

-- Vincular FK faltante en mundo_objetos_desplegados
ALTER TABLE mundo_objetos_desplegados 
ADD CONSTRAINT fk_objeto_producto FOREIGN KEY (producto_contenido_id) REFERENCES productos(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 9. GÓNDOLAS, CAJAS Y MANTENIMIENTO 3D
-- -----------------------------------------------------------------------------
CREATE TABLE gondolas_3d (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    seccion_id INT REFERENCES secciones(id),
    codigo_mueble VARCHAR(30) NOT NULL,
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) DEFAULT 0.00,
    posicion_z NUMERIC(6,2) NOT NULL,
    rotacion_y NUMERIC(5,2) DEFAULT 0.00,
    estado_fisico VARCHAR(20) DEFAULT 'EXCELENTE' CHECK (estado_fisico IN ('EXCELENTE', 'SUCIO', 'DAÑADO'))
);

CREATE TABLE estantes_repisas (
    id SERIAL PRIMARY KEY,
    gondola_id INT REFERENCES gondolas_3d(id) ON DELETE CASCADE,
    nivel_altura_index INT NOT NULL,
    capacidad_maxima_unidades INT DEFAULT 20,
    producto_asignado_id INT REFERENCES productos(id) ON DELETE SET NULL
);

CREATE TABLE cajas_registradoras (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    numero_caja INT NOT NULL,
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) DEFAULT 0.00,
    posicion_z NUMERIC(6,2) NOT NULL,
    rotacion_y NUMERIC(5,2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'CERRADA' CHECK (estado IN ('ABIERTA', 'CERRADA', 'FALLA_TECNICA', 'EN_ARQUEO')),
    efectivo_en_caja DECIMAL(12,2) DEFAULT 0.00
);

CREATE TABLE equipos_mantenimiento (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    nombre_equipo VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    salud_porcentaje NUMERIC(5,2) DEFAULT 100.00,
    costo_reparacion DECIMAL(10,2) DEFAULT 50000.00
);

-- -----------------------------------------------------------------------------
-- 10. RECURSOS HUMANOS Y SEGURIDAD
-- -----------------------------------------------------------------------------
CREATE TABLE empleados_contratos (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    cargo VARCHAR(50) NOT NULL CHECK (cargo IN ('CAJERO', 'REPONEDOR', 'GUARDIA_SEGURIDAD', 'ASEADOR')),
    salario_diario DECIMAL(10,2) NOT NULL,
    eficiencia_trabajo NUMERIC(3,2) DEFAULT 1.00,
    contratado BOOLEAN DEFAULT TRUE
);

CREATE TABLE turnos_laborales (
    id SERIAL PRIMARY KEY,
    empleado_id INT REFERENCES empleados_contratos(id) ON DELETE CASCADE,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    asistio BOOLEAN DEFAULT TRUE
);

CREATE TABLE robos_mermas_incidentes (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad_perdida INT NOT NULL,
    tipo_incidente VARCHAR(30) CHECK (tipo_incidente IN ('ROBO_CLIENTE', 'PRODUCTO_ROTO', 'VENCIMIENTO')),
    costo_total_perdida DECIMAL(12,2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE camaras_seguridad_3d (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    posicion_x NUMERIC(6,2) NOT NULL,
    posicion_y NUMERIC(6,2) NOT NULL,
    posicion_z NUMERIC(6,2) NOT NULL,
    cobertura_grados NUMERIC(5,2) DEFAULT 90.00,
    activa BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 11. BOTS (NPCs) CONDUCTUALES
-- -----------------------------------------------------------------------------
CREATE TABLE npcs_perfiles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    avatar_glb_path VARCHAR(255) NOT NULL,
    personalidad VARCHAR(30) CHECK (personalidad IN ('COMPRADOR_COMPULSIVO', 'BUSCA_OFERTAS', 'PACIENTE', 'IMPACIENTE_CLEPTOMANO')),
    presupuesto_disponible DECIMAL(10,2) NOT NULL,
    paciencia_maxima_segundos INT DEFAULT 60,
    nivel_satisfaccion NUMERIC(3,2) DEFAULT 5.00
);

CREATE TABLE npcs_estados_ia (
    id SERIAL PRIMARY KEY,
    npc_id INT REFERENCES npcs_perfiles(id) ON DELETE CASCADE,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    estado_actual VARCHAR(40) DEFAULT 'ENTRANDO' CHECK (estado_actual IN ('ENTRANDO', 'BUSCANDO_PRODUCTO', 'HACIENDO_FILA', 'PAGANDO_EN_CAJA', 'SALIENDO', 'ROBANDO')),
    posicion_x NUMERIC(6,2),
    posicion_y NUMERIC(6,2),
    posicion_z NUMERIC(6,2)
);

CREATE TABLE carritos_compra_bot (
    id SERIAL PRIMARY KEY,
    npc_id INT REFERENCES npcs_perfiles(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE opiniones_resenas (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    npc_id INT REFERENCES npcs_perfiles(id),
    calificacion_estrellas INT CHECK (calificacion_estrellas BETWEEN 1 AND 5),
    comentario TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 12. VENTAS, REGULACIÓN Y CONTABILIDAD ERP
-- -----------------------------------------------------------------------------
CREATE TABLE regulacion_multas (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    hora_cierre_permitida TIME DEFAULT '22:00:00',
    llamados_atencion INT DEFAULT 0 CHECK (llamados_atencion BETWEEN 0 AND 3),
    total_multas_pagadas_cop DECIMAL(12,2) DEFAULT 0.00,
    ultima_infraccion_fecha TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ventas_encabezado (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    caja_id INT REFERENCES cajas_registradoras(id),
    cajero_empleado_id INT REFERENCES empleados_contratos(id),
    npc_comprador_id INT REFERENCES npcs_perfiles(id),
    subtotal DECIMAL(12,2) NOT NULL,
    impuestos_iva DECIMAL(12,2) NOT NULL,
    total_pagado DECIMAL(12,2) NOT NULL,
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO' CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA_SENA_PAY', 'TRANSFERENCIA')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ventas_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES ventas_encabezado(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    ganancia_bruta DECIMAL(12,2) NOT NULL
);

CREATE TABLE libro_diario_contable (
    id SERIAL PRIMARY KEY,
    jugador_id INT REFERENCES jugador_perfil(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(30) CHECK (tipo_movimiento IN ('INGRESO_VENTA', 'GASTO_NOMINA', 'GASTO_PROVEEDOR', 'GASTO_MANTENIMIENTO', 'PERDIDA_MERMA', 'PAGO_MULTA', 'PAGO_CUOTA_PRESTAMO')),
    monto DECIMAL(15,2) NOT NULL,
    descripcion TEXT NOT NULL,
    saldo_resultante DECIMAL(15,2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- -----------------------------------------------------------------------------
CREATE INDEX idx_jugador_usuario ON jugador_perfil(usuario_id);
CREATE INDEX idx_productos_seccion ON productos(seccion_id);
CREATE INDEX idx_lotes_vencimiento ON lotes_vencimiento(fecha_vencimiento);
CREATE INDEX idx_ventas_jugador_fecha ON ventas_encabezado(jugador_id, fecha);
CREATE INDEX idx_objetos_jugador_entorno ON mundo_objetos_desplegados(jugador_id, ubicacion_entorno);
CREATE INDEX idx_posicion_jugador ON jugador_posicion_mundo(jugador_id);

-- -----------------------------------------------------------------------------
-- 14. SEED INICIAL DE DATOS BASO
-- -----------------------------------------------------------------------------
INSERT INTO secciones (nombre, color_hex, requiere_refrigeracion, temperatura_ideal_c) VALUES
('Lácteos y Refrigerados', '#39A900', true, 4.0),
('Granos y Abarrotes', '#00324D', false, 20.0),
('Aseo y Hogar', '#FF6B00', false, 22.0);

INSERT INTO proveedores (razon_social, nit, calificacion_confiabilidad) VALUES
('Distribuidora Agropecuaria SENA', '899999034-1', 4.95),
('Comercializadora Central de Alimentos', '900123456-7', 4.80);

INSERT INTO logros (titulo, descripcion, nivel_requerido, recompensa_cop, recompensa_xp) VALUES
('Primer Paso SENA', 'Completa el tutorial e inaugura tu tienda de barrio.', 1, 100000.00, 200),
('Camino al D1', 'Alcanza el nivel 5 y desbloquea refrigeradores grandes.', 5, 500000.00, 1000),
('Magnate del Mercadeo', 'Paga la totalidad del préstamo bancario de $10.000.000 COP.', 10, 2000000.00, 5000);

INSERT INTO mapa_edificios_exteriores (codigo_identificador, tipo, es_entrable, posicion_x, posicion_y, posicion_z, modelo_glb_path) VALUES
('CASA_IZQ_01', 'DECORATIVO_NO_ENTRABLE', false, -15.00, 0.00, 0.00, 'models/casas/casa_residencial_1.glb'),
('CASA_IZQ_02', 'DECORATIVO_NO_ENTRABLE', false, -30.00, 0.00, 0.00, 'models/casas/casa_residencial_2.glb'),
('LOCAL_DER_01', 'DECORATIVO_NO_ENTRABLE', false, 15.00, 0.00, 0.00, 'models/locales/panaderia_fachada.glb'),
('LOCAL_DER_02', 'DECORATIVO_NO_ENTRABLE', false, 30.00, 0.00, 0.00, 'models/locales/farmacia_fachada.glb');