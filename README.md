🏥 Sistema Hospitalario HIS

Trabajo Práctico Integrador - Programación Web 2
Carrera: Desarrollo de Software
Alumno: Troncoso Leandro
Año de presentacion 2026

📋 Descripción del Proyecto
Sistema de gestión hospitalaria desarrollado con Node.js y Express que permite administrar pacientes, turnos, internaciones, facturación entre otros modulos relacionados. El sistema cuenta con diferentes roles (Administrativo, Médico, Enfermero, Paciente) cada uno con su propio dashboard y funcionalidades específicas.

🛠️ Tecnologías Utilizadas

Backend: Node.js + Express
Base de Datos: MariaDB
ORM: Sequelize
Vistas: Pug (renderizado server-side)
Frontend: Bootstrap 5, Font Awesome
Autenticación: JWT + bcryptjs


⚙️ Instalación y Configuración
Requisitos previos

Node.js (v18 o superior)
MySQL o MariaDB
Git

Pasos para instalar
bash# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/sistema-hospitalario.git
cd sistema-hospitalario

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos
mysql -u root -p
CREATE DATABASE sistema_hospitalario;
exit;

# 4. Configurar variables de entorno
# Crear archivo .env en la raíz del proyecto (ver ejemplo abajo)

# 5. Ejecutar migraciones (crea las tablas)
node migrationMaster.js up

# 6. Ejecutar seeders (carga datos de prueba)
node seedMaster.js up

# 7. Iniciar el servidor
npm run dev
El servidor estará disponible en: http://localhost:3000
Archivo .env
envDB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_hospitalario

JWT_SECRET=clave_secreta_jwt
SESSION_SECRET=clave_secreta_sesion

PORT=3000
NODE_ENV=development

👥 Usuarios de Prueba
Todos los usuarios tienen la contraseña: temporal1234
enfermero1@hospital.com
admin@hospital.com
medico1@hospital.com
paciente1@email.com


📁 Estructura del Proyecto
sistema-hospitalario/
├── controllers/
|            |_ admin /        # Lógica de negocio
│            |     ├── adminController.js
│            |     ├── admisionController.js
│            ├── paciente/         # Controladores del paciente
│            └── ...
├── models/               # Modelos de Sequelize
├── routes/               # Definición de rutas
├── views/                # Plantillas Pug
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── medico/
│   │   ├── enfermero/
│   │   └── paciente/
│   └── layouts/
├── middleware/           # Middleware de autenticación
├── database/
│   ├── migrations/       # Migraciones de BD
│   └── seeders/          # Datos iniciales
├── public/               # Archivos estáticos
├── app.js                # Archivo principal
└── .env                  # Variables de entorno

🔧 Funcionalidades por Rol
Administrador

Dashboard con estadísticas generales del hospital
Gestión completa de admisiones
Gestión de internaciones y asignación de camas
Administración de turnos
Sistema de facturación
Configuración del sistema (sectores, especialidades, estructura, obras sociales, etc.)
Gestión de usuarios

Médico

Dashboard con turnos del día
Visualización de pacientes asignados
Registro de evaluaciones médicas
Diagnósticos y tratamientos
Solicitud de estudios
Generación de altas médicas

Enfermero

Dashboard de enfermería
Triaje de pacientes
Registro de signos vitales
Administración de medicación
Procedimientos de enfermería
Preparación pre-quirúrgica

Paciente

Dashboard personal con resumen
Visualización de turnos programados
Solicitud de nuevos turnos
Consulta de lista de espera
Visualización de facturas
Acceso al historial médico


## Base de Datos
El sistema cuenta con 43 tablas. Las principales son:
Usuarios y Roles:

usuarios, roles, pacientes, medicos, enfermeros, administrativos

Gestión Hospitalaria:

admisiones, internaciones, turnos, altas_medicas, listas_esperas

Infraestructura:

sectores, habitaciones, camas

Clínico:

evaluaciones_medicas, evaluaciones_enfermeria, diagnosticos, tratamientos

Facturación:

facturas, pagos, obras_sociales

Comandos útiles de BD
bash# Crear tablas
node migrationMaster.js up

# Eliminar tablas
Eliminar de la Base de datos y volver a migrationesMaster.js

# Cargar datos de prueba
node seedMaster.js 

## Sistema de Autenticación

Autenticación mediante JWT (JSON Web Tokens)
Contraseñas encriptadas con bcryptjs
Token almacenado en cookie HttpOnly
Middleware de protección de rutas por rol
Sesiones de Express como respaldo


## Dificultades Encontradas y Soluciones
Durante el desarrollo del proyecto me enfrenté a varios desafíos técnicos. A continuación detallo los principales problemas y cómo los resolví:
1. Relaciones de Sequelize entre 43 modelos
Problema: Con tantas tablas relacionadas, al principio las asociaciones no funcionaban. Los includes traían null o daban errores de "association not found".
Solución: Aprendí que el orden importa: el modelo que tiene la FK debe usar belongsTo, y el otro usa hasOne o hasMany. Tuve que revisar cada relación y corregir los alias (as) para que coincidan.

2. Despliegue en producción (Railway/DBeaver)
Problema: El proyecto funcionaba perfecto en localhost pero al subirlo a Railway las relaciones de la base de datos se rompían. Las foreign keys daban errores.
Solución: El problema era el orden de ejecución de las migraciones. Las tablas con FK se creaban antes que las tablas referenciadas. Reorganicé las migraciones en el orden correcto y funcionó.

3. Sistema de Altas Médicas
Problema: Al dar de alta a un paciente, había que actualizar múltiples tablas: la internación, liberar la cama, cambiar estado del paciente, generar factura. Si fallaba algo quedaba todo inconsistente.
Solución: Implementé transacciones de Sequelize. Si algo falla, hace rollback y no queda nada a medias:
javascriptconst transaction = await db.sequelize.transaction();
try {
  // todas las operaciones
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}

4. Búsqueda Global de Pacientes
Problema: La búsqueda debía encontrar pacientes por DNI, nombre o apellido, a veces no encontraban resultados que sí existían.
Solución: Usé el operador Op.like de Sequelize con comodines y agregué índices en la base de datos para los campos de búsqueda:
javascriptwhere: {
  [Op.or]: [
    { dni: { [Op.like]: `%${busqueda}%` } },
    { nombre: { [Op.like]: `%${busqueda}%` } }
  ]
}

5. Validaciones con Hooks de Sequelize
Problema: Necesitaba validar ciertas condiciones antes de guardar (por ejemplo, que una cama esté libre antes de asignarla), pero las validaciones del modelo no alcanzaban.
Solución: Implementé hooks beforeCreate y beforeUpdate en los modelos para validaciones más complejas que involucran consultas a otras tablas.

6. Lógica de Internaciones
Problema: La internación tiene muchas reglas: el paciente debe estar admitido, la cama debe estar libre Y limpia, si la habitación es compartida no puede haber un paciente del sexo opuesto.
Solución: Creé validaciones paso a paso en el controller, verificando cada condición antes de crear la internación. Si alguna falla, devuelve un mensaje específico del error.

7. Control de Permisos por Rol
Problema: Un médico puede ver información de pacientes pero no debería poder crear usuarios nuevos ni modificar configuraciones. ¿Cómo restringir acciones específicas?
Solución: Creé un middleware requireRole que recibe un array de roles permitidos y verifica antes de ejecutar la acción:
javascriptrouter.get('/usuarios', authMiddleware, requireRole(['ADMINISTRATIVO']), controller.getUsuarios);

8. Asignación de Camas por Sexo
Problema: En habitaciones compartidas (2 camas), si hay un paciente masculino, no se puede asignar la otra cama a una paciente femenina. La lógica era complicada.
Solución: Al asignar cama, primero busco si la habitación tiene otra cama ocupada. Si la tiene, verifico el sexo del paciente internado y lo comparo con el nuevo paciente. Si no coinciden, busco otra habitación.

9. Lista de Espera con Prioridades
Problema: La lista de espera no es simple FIFO (primero en llegar, primero en salir). Tiene prioridades (Alta, Media, Baja) y dentro de cada prioridad sí es por orden de llegada.
Solución: Implementé un ORDER BY compuesto: primero ordena por prioridad (ALTA=1, MEDIA=2, BAJA=3) y luego por fecha de registro. También calculé la "posición en cola" para mostrarle al paciente.

10. Autenticación JWT + Cookies + Sesiones
Problema: Al principio guardaba el token tenia problemas para usarlo, en cookies pero perdía la sesión al refrescar.
Solución: el token JWT va en una cookie HttpOnly , y además guardo datos básicos del usuario en la sesión de Express para las vistas Pug.

11. Dashboard con Múltiples Estadísticas
Problema: El dashboard del admin necesita mostrar muchos contadores (pacientes activos, camas ocupadas, turnos de hoy, etc.). Hacer tantas consultas lo hacía muy lento.
Solución: Usé Promise.all para ejecutar todas las consultas en paralelo en lugar de una después de otra:
javascriptconst [pacientes, camas, turnos] = await Promise.all([
  Paciente.count({ where: { estado: 'Activo' } }),
  Cama.count({ where: { estado: 'Ocupada' } }),
  Turno.count({ where: { fecha: hoy } })
]);

12. Facturación con Obras Sociales
Problema: Si el paciente tiene obra social, parte la paga la OS y parte el hospital (si es público). Calcular los montos y generar las facturas correctas era confuso.
Solución: Creé una lógica que calcula el porcentaje de cobertura de la obra social y genera dos facturas si corresponde: una para la OS y otra para el sistema público con el remanente.

13. Turnos: Evitar Solapamiento de Horarios
Problema: No puede haber dos turnos para el mismo médico en el mismo horario. Al asignar turno tenía que verificar disponibilidad.
Solución: Antes de crear el turno, busco si existe algún turno del mismo médico que se solape con el horario solicitado. Uso operadores de fecha para verificar que no haya conflicto.

14. Cancelación de Turnos en Cascada
Problema: Si cancelo un turno que vino de una lista de espera, también tengo que actualizar la lista de espera. Y si hay factura asociada, también.
Solución: Todo dentro de una transacción: actualizo el turno a "CANCELADO", actualizo la lista de espera a "CANCELADO" y le quito el turno_id, y si hay factura la marco como "Cancelada".

15. Manejo de Pacientes Temporales
Problema: A veces llega un paciente inconsciente o sin documentos y hay que atenderlo igual. No puedo pedirle DNI ni datos completos.
Solución: Implementé un tipo de paciente "Temporal" que se crea con datos mínimos (se le asigna un DNI temporal único). Luego cuando se identifica, se actualizan sus datos reales.

16. Problema: redifinir el proyecto planter nuevas soluciones a problemas me generaba dificultades en modelos vistas controller, este fue una de las trabas que tube mas importantes por que no podia avanzar con el proyecto en tiempo y forma, pero tampoco podia no hacer las actualizaciones para tener un sistema hospitalario desente.

17. Otros millones de dificultades en mandar datos, obtenerlos, trabajar con ellos, filtrarlos, autentificarlo, cumplir con todos los requisitos de los modelos para crear, en definitiva son un millon de problemas menos que debo aprender a resolver.

## Mejoras Futuras

 Sistema de mensajería interna
 Notificaciones por email
 Recuperación de contraseña
 Reportes exportables a PDF/Excel
 Gráficos estadísticos en dashboards

## Contacto
Alumno: Troncoso Leandro
Materia: Programación Web 2