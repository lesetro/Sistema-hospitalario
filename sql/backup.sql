-- Crear base de datos
CREATE DATABASE IF NOT EXISTS DB_hospital;
USE DB_hospital;

-- Tablas
CREATE TABLE Usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(8) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('Paciente', 'Medico', 'Enfermero', 'AdministradorCentral', 'Administrativo', 'LimpiezaMantenimiento', 'AdministradorGeneral') NOT NULL,
  hospital_id INT
);

CREATE TABLE Hospitales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cuit VARCHAR(11) UNIQUE NOT NULL,
  director VARCHAR(255),
  telefono VARCHAR(10),
  email VARCHAR(255),
  numero_medicos INT NOT NULL,
  numero_camas INT NOT NULL
);

CREATE TABLE Pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNIQUE,
  hospital_id INT,
  obra_social_id INT,
  motivo TEXT,
  estado_triaje ENUM('Rojo', 'Amarillo', 'Verde', 'NN') DEFAULT 'Verde',
  fecha_ingreso DATETIME,
  enfermero_id INT,
  derivado_a VARCHAR(255),
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id),
  FOREIGN KEY (enfermero_id) REFERENCES Usuarios(id)
);

CREATE TABLE Biometrias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT UNIQUE,
  rostro VARCHAR(255),
  huella VARCHAR(255),
  biometria_externa VARCHAR(255),
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id)
);

CREATE TABLE Camas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT,
  habitacion VARCHAR(50),
  numero_cama INT,
  estado ENUM('Verde', 'Amarilla', 'Roja') DEFAULT 'Verde',
  disponibilidad ENUM('Libre', 'Ocupada', 'EnLimpieza') DEFAULT 'Libre',
  tiempo_limpieza INT DEFAULT 20,
  fecha_fin_limpieza DATETIME,
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE CamasAsignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cama_id INT,
  paciente_id INT,
  estado ENUM('Verde', 'Amarilla', 'Roja'),
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  FOREIGN KEY (cama_id) REFERENCES Camas(id),
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id)
);

CREATE TABLE ListasEspera (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  hospital_id INT,
  estado ENUM('Verde', 'Amarilla', 'Roja') DEFAULT 'Verde',
  prioridad INT DEFAULT 0,
  fecha DATETIME,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE ConfiguracionesIntercalado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT,
  verdes_por_amarillo INT DEFAULT 3,
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE ObrasSociales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cuit VARCHAR(11) UNIQUE NOT NULL,
  descripcion TEXT
);

CREATE TABLE Especialidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT
);

CREATE TABLE Estudios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT
);

CREATE TABLE HospitalesEstudios (
  hospital_id INT,
  estudio_id INT,
  PRIMARY KEY (hospital_id, estudio_id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id),
  FOREIGN KEY (estudio_id) REFERENCES Estudios(id)
);

CREATE TABLE Turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  medico_id INT,
  hospital_id INT,
  especialidad_id INT,
  fecha DATE,
  hora TIME,
  duracion INT DEFAULT 40,
  tipo ENUM('Estudio', 'Consulta', 'Operacion', 'Guardia'),
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES Usuarios(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id),
  FOREIGN KEY (especialidad_id) REFERENCES Especialidades(id)
);

CREATE TABLE TurnosPersonal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  hospital_id INT,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  tipo ENUM('Guardia', 'Consulta'),
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE Notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  mensaje TEXT,
  leida BOOLEAN DEFAULT FALSE,
  fecha DATETIME,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE Reclamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  hospital_id INT,
  descripcion TEXT,
  fecha DATETIME,
  estado ENUM('Pendiente', 'EnRevision', 'Resuelto') DEFAULT 'Pendiente',
  descargo_texto TEXT,
  descargo_usuario_id INT,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id),
  FOREIGN KEY (descargo_usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE RecetasCertificados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  medico_id INT,
  hospital_id INT,
  fecha DATETIME,
  hora TIME,
  motivo TEXT,
  detalles TEXT,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES Usuarios(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE Facturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  hospital_id INT,
  obra_social_id INT,
  numero VARCHAR(50),
  fecha DATE,
  monto DECIMAL(10,2),
  detalle TEXT,
  tipo ENUM('A', 'B', 'C'),
  estado ENUM('Borrador', 'Aprobada') DEFAULT 'Borrador',
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id),
  FOREIGN KEY (obra_social_id) REFERENCES ObrasSociales(id)
);

CREATE TABLE SolicitudesHospitales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cuit VARCHAR(11) UNIQUE NOT NULL,
  director VARCHAR(255),
  telefono VARCHAR(10),
  email VARCHAR(255),
  numero_medicos INT,
  numero_camas INT,
  estudios TEXT,
  estado ENUM('Pendiente', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente'
);

CREATE TABLE SolicitudesDerivaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  hospital_origen_id INT,
  hospital_destino_id INT,
  motivo TEXT,
  historial TEXT,
  contacto VARCHAR(255),
  estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(id),
  FOREIGN KEY (hospital_origen_id) REFERENCES Hospitales(id),
  FOREIGN KEY (hospital_destino_id) REFERENCES Hospitales(id)
);

CREATE TABLE Comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  texto TEXT,
  fecha DATETIME,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE Noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  texto TEXT,
  fecha DATETIME,
  hospital_id INT,
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

CREATE TABLE Enfermeros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNIQUE,
  hospital_id INT,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
  FOREIGN KEY (hospital_id) REFERENCES Hospitales(id)
);

-- Datos de prueba
INSERT INTO Hospitales (nombre, cuit, director, telefono, email, numero_medicos, numero_camas) 
VALUES ('Hospital Central', '30712345678', 'Dr. Juan Pérez', '1123456789', 'central@hospital.com', 20, 100);

INSERT INTO ObrasSociales (nombre, cuit, descripcion) 
VALUES 
  ('OSDE', '30787654321', 'Obra social privada'),
  ('Swiss Medical', '30787654322', 'Obra social privada'),
  ('PAMI', '30787654323', 'Obra social jubilados'),
  ('OSECAC', '30787654324', 'Obra social empleados comercio');

INSERT INTO Especialidades (nombre, descripcion) 
VALUES 
  ('Cardiología', 'Atención de enfermedades cardíacas'),
  ('Oncología', 'Tratamiento de cáncer'),
  ('Maternidad', 'Atención de embarazos y partos'),
  ('Rehabilitación', 'Recuperación física'),
  ('Quimioterapia', 'Tratamiento oncológico'),
  ('Traumatología', 'Lesiones óseas'),
  ('Pediatría', 'Atención infantil'),
  ('Neurología', 'Enfermedades neurológicas'),
  ('Dermatología', 'Enfermedades de la piel'),
  ('Oftalmología', 'Enfermedades oculares');

INSERT INTO Estudios (nombre, descripcion) 
VALUES 
  ('Análisis de sangre', 'Estudio de componentes sanguíneos'),
  ('Radiografía', 'Imágenes de huesos y órganos'),
  ('Ecografía', 'Imágenes por ultrasonido'),
  ('Tomografía', 'Imágenes detalladas'),
  ('Resonancia magnética', 'Imágenes de alta precisión');

INSERT INTO HospitalesEstudios (hospital_id, estudio_id) 
VALUES (1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

INSERT INTO Usuarios (dni, nombre, email, password, rol, hospital_id) 
VALUES 
  ('12345678', 'Paciente Prueba', 'paciente@test.com', '$2b$10$...', 'Paciente', 1),
  ('87654321', 'Dr. Médico', 'medico@test.com', '$2b$10$...', 'Medico', 1),
  ('11223344', 'Enfermero Prueba', 'enfermero@test.com', '$2b$10$...', 'Enfermero', 1),
  ('55667788', 'Admin Central', 'admin@test.com', '$2b$10$...', 'AdministradorCentral', 1),
  ('99001122', 'Administrativo Prueba', 'administra@test.com', '$2b$10$...', 'Administrativo', 1),
  ('33445566', 'Limpieza Prueba', 'limpieza@test.com', '$2b$10$...', 'LimpiezaMantenimiento', 1),
  ('77889900', 'Admin General', 'general@test.com', '$2b$10$...', 'AdministradorGeneral', NULL);

INSERT INTO Pacientes (usuario_id, hospital_id, estado_triaje) 
VALUES (1, 1, 'Verde');

INSERT INTO Enfermeros (usuario_id, hospital_id) 
VALUES (3, 1);

INSERT INTO Camas (hospital_id, habitacion, numero_cama, estado, disponibilidad) 
VALUES 
  (1, 'Habitación 1', 1, 'Verde', 'Libre'),
  (1, 'Habitación 1', 2, 'Verde', 'Libre');

INSERT INTO Noticias (titulo, texto, fecha, hospital_id) 
VALUES ('Bienvenida', 'Bienvenidos al Hospital Central', NOW(), 1);