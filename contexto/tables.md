# Modelo de Datos Completo — Sistema de Pedidos, Rutas y Rastreo (Multi-empresa SaaS)

Este sistema soporta:

* múltiples empresas
* vendedores con rastreo en tiempo real
* rutas con múltiples visitas
* pedidos con múltiples productos
* incidencias con evidencia
* inventario
* historial completo

---

# Núcleo: Multi-tenant

## Empresa

Representa cada negocio independiente que usa el sistema.

```md
Empresa
- id (PK)
- nombre
- rfc
- telefono
- direccion
- logoUrl
- activo
- createdAt
```

Relaciones:

* 1 Empresa → muchos Usuarios
* 1 Empresa → muchos Clientes
* 1 Empresa → muchos Productos
* 1 Empresa → muchas Rutas
* 1 Empresa → muchos Pedidos

---

# Autenticación y Usuarios

## Usuario

Entidad de autenticación.

```md
Usuario
- id (PK)
- empresaId (FK)
- username
- passwordHash
- rol (OWNER, ADMIN, SELLER)
- activo
- createdAt
```

---

## Vendedor

Perfil del usuario vendedor.

```md
Vendedor
- id (PK)
- empresaId (FK)
- usuarioId (FK)
- nombreCompleto
- telefono
- rfc
- status (ACTIVO, INACTIVO)

# cache para acceso rápido
- ultimaUbicacionLat
- ultimaUbicacionLng
- ultimaConexion
```

Relaciones:

* 1 vendedor → muchas ubicaciones
* 1 vendedor → muchas rutas
* 1 vendedor → muchos pedidos
* 1 vendedor → muchas incidencias

---

# Rastreo en Tiempo Real

## UbicacionVendedor

Guarda historial completo de posiciones GPS.

```md
UbicacionVendedor
- id (PK)
- empresaId (FK)
- vendedorId (FK)
- latitud
- longitud
- precision (metros)
- velocidad (km/h)
- bateria (%)
- fechaHora
```

Esto permite:

* ver ubicación en tiempo real
* ver historial de movimiento
* auditar rutas reales

---

# Clientes

## Cliente

```md
Cliente
- id (PK)
- empresaId (FK)
- nombreCompleto
- telefono
- rfc
- activo
- createdAt
```

---

## PuntoVenta

Un cliente puede tener múltiples ubicaciones físicas.

```md
PuntoVenta
- id (PK)
- empresaId (FK)
- clienteId (FK)
- nombre
- direccion
- latitud
- longitud
- horario
- notas
- activo
```

Relaciones:

* 1 Cliente → muchos PuntoVenta

---

# Productos e Inventario

## Producto

Catálogo base.

```md
Producto
- id (PK)
- empresaId (FK)
- nombre
- unidad (pieza, caja, paquete)
- activo
```

---

## PrecioProducto

Historial de precios.

```md
PrecioProducto
- id (PK)
- empresaId (FK)
- productoId (FK)
- precio
- vigenteDesde
```

Permite saber el precio histórico real de cada venta.

---

## Inventario

Cantidad disponible.

```md
Inventario
- id (PK)
- empresaId (FK)
- productoId (FK)

# puede ser almacen o vendedor
- ubicacionTipo (ALMACEN, VENDEDOR)
- ubicacionId

- cantidad
```

---

## MovimientoInventario

Auditoría completa.

```md
MovimientoInventario
- id (PK)
- empresaId (FK)
- productoId (FK)

- tipo
  (ENTRADA
   SALIDA
   VENTA
   MERMA
   AJUSTE)

- cantidad

- referenciaTipo
  (PEDIDO, AJUSTE, DEVOLUCION)

- referenciaId

- fecha
```

---

# Pedidos

## Pedido

```md
Pedido
- id (PK)
- empresaId (FK)

- clienteId (FK)
- puntoVentaId (FK)

- vendedorId (FK)

- total

- estatus
  (BORRADOR
   CONFIRMADO
   ENTREGADO
   CANCELADO)

- fecha
```

---

## PedidoItem

Productos dentro del pedido.

```md
PedidoItem
- id (PK)
- empresaId (FK)

- pedidoId (FK)

- productoId (FK)

- cantidad

- precioUnitario

- subtotal
```

Relación:

* 1 Pedido → muchos PedidoItem

---

# Rutas

Representa el plan de trabajo del vendedor.

## Ruta

```md
Ruta
- id (PK)
- empresaId (FK)

- vendedorId (FK)

- fecha

- estatus
  (PLANIFICADA
   EN_PROGRESO
   FINALIZADA)
```

---

## RutaParada

Cada cliente dentro de la ruta.

```md
RutaParada
- id (PK)
- empresaId (FK)

- rutaId (FK)

- clienteId (FK)
- puntoVentaId (FK)

- orden

- estatusVisita
  (PENDIENTE
   VISITADO
   NO_VISITADO)

- pedidoId (FK nullable)
- incidenciaId (FK nullable)
```

Relación:

* 1 Ruta → muchas paradas

---

# Visitas reales

Representa el evento físico real.

```md
Visita
- id (PK)
- empresaId (FK)

- rutaParadaId (FK)

- vendedorId (FK)

# llegada real
- latitudLlegada
- longitudLlegada
- fechaLlegada

# salida real
- latitudSalida
- longitudSalida
- fechaSalida

- resultado
  (PEDIDO
   NO_ESTABA
   NO_QUISO
   CERRADO
   OTRO)

- notas
```

Esto permite saber si realmente fue.

---

# Incidencias

Eventos irregulares.

```md
Incidencia
- id (PK)
- empresaId (FK)

- clienteId (FK)
- vendedorId (FK)

- tipo
  (CLIENTE_CERRADO
   CLIENTE_NO_ESTABA
   PROBLEMA_PAGO
   OTRO)

- descripcion

- fecha
```

---

## Archivo

Evidencias.

```md
Archivo
- id (PK)
- empresaId (FK)

- url
- tipo
- fecha
```

---

## IncidenciaArchivo

Relación.

```md
IncidenciaArchivo
- id (PK)

- empresaId (FK)

- incidenciaId (FK)
- archivoId (FK)
```

---

# Flujo real del sistema

Secuencia real en campo:

```md
Dueño crea Empresa

Dueño crea:
- Productos
- Clientes
- PuntosVenta
- Usuarios vendedores

Dueño crea Ruta

Ruta contiene Paradas

Vendedor inicia app

App envía UbicacionVendedor cada 10–20 segundos

Vendedor llega a parada

Sistema crea Visita

Vendedor puede:

- crear Pedido
o
- crear Incidencia

Sistema ajusta Inventario

Dueño ve todo en tiempo real
```

---

# Este modelo soporta sin cambios:

* 1 empresa

* 100 empresas

* 100,000 empresas

* 10 vendedores

* 10,000 vendedores

* rastreo en tiempo real

* historial completo

* auditoría total