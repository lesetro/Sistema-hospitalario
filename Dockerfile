# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package.json .
COPY . .

# Instala dependencias
RUN npm install

# Instala paquetes adicionales (como express y pug)
RUN npm install express pug

# Expone el puerto (ajusta según tu app)
EXPOSE 3000

# Comando para iniciar la app
CMD ["node", "app.js"]