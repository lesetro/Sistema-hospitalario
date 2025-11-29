
Para Relaciones 1:1
// En el modelo que TIENE la FK:
ModeloA.belongsTo(ModeloB, { foreignKey: 'modelo_b_id', as: 'modeloB' });

// En el otro modelo:
ModeloB.hasOne(ModeloA, { foreignKey: 'modelo_b_id', as: 'modeloA' });

Para relaciones 1: N
// En el modelo que NO TIENE la FK:
ModeloA.hasMany(ModeloB, { foreignKey: 'modelo_a_id', as: 'modelosB' });

// En el modelo que TIENE la FK:
ModeloB.belongsTo(ModeloA, { foreignKey: 'modelo_a_id', as: 'modeloA' });

## Setup del proyecto

\`\`\`bash
# 1. Clonar repositorio
git clone [tu-repo]
cd sistema-hospitalario

# 2. Instalar dependencias
npm install

# 3. Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear BD
mysql -u root -p
CREATE DATABASE sistema_hospitalario;

# 5. Ejecutar migraciones
node migrationMaster.js up

# 6. Cargar datos iniciales
node seedMaster.js up

# 7. Iniciar servidor
npm run dev

# instalar dependencias 

"dependencies":
    "npm install node"
    "bcrypt"
    "bcryptjs"
    "bootstrap"
    "cors"
    "dotenv"
    "express"
    "mariadb"
    "mysql2"
    "pug"
    "sequelize"
    "umzug": "
    "nodemon"

## como cargar los datos en la base 
  
# Crear tablas
node migrationMaster.js up


# Insertar datos
node seedMaster.js up

# Borrar datos
lo hago desde SQL mariaDB en opperaciones , selecciono eliminar base de datos
Creo desde ahi mismo unu nueva base de datos




las contraseñas luego se deben cargar en el .env.

# Proyecto
Bienbenidos al proyecto hospitalario en cargado de gestionar pacientes, medicos, enfermeros, administrativos
cada quien con un rol dentro del sistema, con la particularidad de que los pacientes pueden estar registrado dentro del sistema o bien pueden registrarse por admisiniones, dependiendo de la necesidad y de los recursos informaticos del paciente, desde administracion se puede generar pacientes temporales, que estan pensado para el caso de personas que no fueron registradas y no pueden presentar sus datos por problemas de salud,la dashboard da la posibilidad de crear un paciente y darle una admision, internarlo asignarle una cama, una habitacion, se planea a futuro que cada rol tenga su dashboard para manipular la informacion deacuerdo sea el caso, el paciente tendra la posibilidad de sacar turnos luego de ser atendido por el personal de salud, en casos como el prequirugico, consultar , simular pagos , recibir notificaciones, realizar quejas, este proyecto abarca muchos puntos importantes pero el mas destacado es la fluides con la que se planea la comunicacion entre las partes, obviamente para poder ingresar cada quien tendra que autentificarse, y asi gestionar su espacio de trabajo.
Con esta brebe introducion paso a comentar como fui afrontando las diferentes dificultades a la hora de realizar el proyecto, sinceramente fueron mas de los esperados, cada nueva tecnologia que iba aplicando complicaba el comportamiento de las anteriores, de todas maneras fue un parendizaje contante, entretenido, y valioso. Pero tengo que informar que el ultimo gran avance que tube me genero errores que no me dio el tiempo para poder solucionar, quize poner en produccion el proyecto y las relaciones que tenia estaban andando bien en Sql mariaDb pero cuando las importe a DBeaver para poder trabajar con railway se me rompio todo, como vera a mi izquierda, tengo mucho trabajo hecho y quisiera pedirle que me de mas tiempo para resolver estos problemas, de todas maneras cuando rinda esta materia tendria que tener asimilado muchos conceptos y haber realizado el 100% del proyecto, hoy 17 de junio, hize las pruebas y no fueron sactifactorias todas, frustra un poco ponerle tanto esfuerzo a este trabajo y no dejarlo como me hubiera gustado, antes de hacer todos estos cambios en las relaciones el proyecto andaba muy bien adjunto imagenes dentro del proyecto, de como generaba paciente, internacion, paciente temporal, pero luego de querer generar una url y vincularla con DBeaver se me complico el proyecto.
Come vera se realizaron migraciones, seeder, backup, generaron las tablas, que en total son una 43, no utilize la totalidad pero me parecio importante platar las bases del proyecto y el alcanze que se esperaba obtener.


