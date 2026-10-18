-- ============================================
-- UFit — BD comercial (Neon Postgres)
-- El agente Coach la consulta vía Neon MCP (run_sql).
-- Prefijo ufit_ para no chocar con las tablas de los labs del curso.
-- ============================================

DROP TABLE IF EXISTS ufit_detalle_pedidos CASCADE;
DROP TABLE IF EXISTS ufit_pedidos CASCADE;
DROP TABLE IF EXISTS ufit_productos CASCADE;
DROP TABLE IF EXISTS ufit_clientes CASCADE;

CREATE TABLE ufit_clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    ciudad VARCHAR(100) NOT NULL,
    nivel_club VARCHAR(10) NOT NULL CHECK (nivel_club IN ('Bronce', 'Plata', 'Oro'))
);

CREATE TABLE ufit_productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('calzado', 'ropa', 'equipo', 'relojes', 'accesorios')),
    talla VARCHAR(10),
    precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE ufit_pedidos (
    numero_pedido VARCHAR(10) PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES ufit_clientes(id),
    fecha_pedido DATE NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pagado', 'enviado', 'entregado', 'cancelado', 'devuelto'))
);

CREATE TABLE ufit_detalle_pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(10) NOT NULL REFERENCES ufit_pedidos(numero_pedido),
    id_producto INT NOT NULL REFERENCES ufit_productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL
);

INSERT INTO ufit_clientes (nombre, email, ciudad, nivel_club) VALUES
('Laura Méndez', 'laura.mendez@example.com', 'Puebla', 'Plata'),
('Jorge Pérez', 'jorge.perez@example.com', 'Mérida', 'Bronce'),
('Sofía Castillo', 'sofia.castillo@example.com', 'Querétaro', 'Oro'),
('Ricardo Garza', 'ricardo.garza@example.com', 'Monterrey', 'Plata'),
('Ana Lucía Torres', 'ana.torres@example.com', 'Guadalajara', 'Bronce'),
('Pedro Hernández', 'pedro.hernandez@example.com', 'Tuxtla Gutiérrez', 'Bronce'),
('Valeria Ruiz', 'valeria.ruiz@example.com', 'Ciudad de México', 'Oro'),
('Daniela Ramírez', 'daniela.ramirez@example.com', 'León', 'Bronce'),
('Miguel Ángel Soto', 'miguel.soto@example.com', 'Toluca', 'Plata'),
('Fernanda López', 'fernanda.lopez@example.com', 'Tijuana', 'Bronce');

INSERT INTO ufit_productos (sku, nombre, categoria, talla, precio, stock) VALUES
('CAL-NIM-25', 'Tenis running Velox Nimbus', 'calzado', '25', 2499.00, 6),
('CAL-NIM-26', 'Tenis running Velox Nimbus', 'calzado', '26', 2499.00, 3),
('CAL-NIM-27', 'Tenis running Velox Nimbus', 'calzado', '27', 2499.00, 0),
('CAL-NIM-28', 'Tenis running Velox Nimbus', 'calzado', '28', 2499.00, 4),
('CAL-TRA-26', 'Tenis trail Andes Grip', 'calzado', '26', 2899.00, 2),
('CAL-TRA-27', 'Tenis trail Andes Grip', 'calzado', '27', 2899.00, 5),
('CAL-FUT-26', 'Tacos fútbol Gol Pro FG', 'calzado', '26', 1799.00, 8),
('ROP-PLA-M', 'Playera dry-fit UFit Core', 'ropa', 'M', 399.00, 25),
('ROP-PLA-L', 'Playera dry-fit UFit Core', 'ropa', 'L', 399.00, 0),
('ROP-LEG-S', 'Leggings compresión UFit Flex', 'ropa', 'S', 699.00, 12),
('ROP-LEG-M', 'Leggings compresión UFit Flex', 'ropa', 'M', 699.00, 7),
('ROP-SUD-L', 'Sudadera térmica UFit Warm', 'ropa', 'L', 1199.00, 4),
('EQU-MAN-10', 'Mancuernas ajustables 10 kg (par)', 'equipo', NULL, 1899.00, 10),
('EQU-BIC-01', 'Bicicleta estática UFit Spin 300', 'equipo', NULL, 8999.00, 3),
('EQU-CAM-01', 'Caminadora plegable UFit Run 500', 'equipo', NULL, 14999.00, 1),
('REL-PUL-01', 'Reloj GPS Pulse Run 2', 'relojes', NULL, 4599.00, 6),
('ACC-BAL-05', 'Balón de fútbol UFit Match No. 5', 'accesorios', NULL, 549.00, 30),
('ACC-TAP-01', 'Tapete de yoga UFit Grip 6 mm', 'accesorios', NULL, 649.00, 15);

INSERT INTO ufit_pedidos (numero_pedido, id_cliente, fecha_pedido, total, metodo_pago, estado) VALUES
('UF-1001', 1, '2026-09-27', 2898.00, 'tarjeta', 'entregado'),
('UF-1002', 2, '2026-08-30', 2499.00, 'oxxo', 'entregado'),
('UF-1003', 3, '2026-10-13', 4599.00, 'tarjeta', 'enviado'),
('UF-1004', 4, '2026-10-17', 8999.00, 'tarjeta', 'pagado'),
('UF-1005', 5, '2026-10-12', 1398.00, 'paypal', 'enviado'),
('UF-1006', 6, '2026-09-30', 1799.00, 'spei', 'enviado'),
('UF-1007', 7, '2026-10-16', 14999.00, 'tarjeta', 'enviado'),
('UF-1008', 8, '2026-10-09', 2499.00, 'mercadopago', 'entregado'),
('UF-1009', 9, '2026-09-23', 1899.00, 'tarjeta', 'entregado'),
('UF-1010', 10, '2026-09-14', 1199.00, 'oxxo', 'devuelto'),
('UF-1011', 3, '2026-07-02', 2899.00, 'tarjeta', 'entregado'),
('UF-1012', 7, '2026-08-11', 1098.00, 'tarjeta', 'entregado'),
('UF-1013', 1, '2026-08-19', 649.00, 'paypal', 'entregado'),
('UF-1014', 4, '2026-09-05', 4599.00, 'tarjeta', 'entregado'),
('UF-1015', 9, '2026-10-05', 399.00, 'oxxo', 'cancelado');

INSERT INTO ufit_detalle_pedidos (numero_pedido, id_producto, cantidad, precio_unitario) VALUES
('UF-1001', 2, 1, 2499.00), ('UF-1001', 8, 1, 399.00),
('UF-1002', 1, 1, 2499.00),
('UF-1003', 16, 1, 4599.00),
('UF-1004', 14, 1, 8999.00),
('UF-1005', 10, 2, 699.00),
('UF-1006', 7, 1, 1799.00),
('UF-1007', 15, 1, 14999.00),
('UF-1008', 4, 1, 2499.00),
('UF-1009', 13, 1, 1899.00),
('UF-1010', 12, 1, 1199.00),
('UF-1011', 6, 1, 2899.00),
('UF-1012', 17, 2, 549.00),
('UF-1013', 18, 1, 649.00),
('UF-1014', 16, 1, 4599.00),
('UF-1015', 8, 1, 399.00);
