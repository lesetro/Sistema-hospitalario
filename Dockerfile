# Usa imagen oficial de Node.js
FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm install

npm install express pug


# Copia el resto del proyecto
COPY . .

# Expone el puerto (ajusta si usas otro)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
