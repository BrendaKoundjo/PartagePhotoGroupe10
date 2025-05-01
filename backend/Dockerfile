FROM node:18-alpine

# Crée et définit le répertoire de travail
WORKDIR /app

# Copie les fichiers de configuration du package
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie tous les fichiers du projet
COPY . .

# Port exposé par l'application
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "serveur.js"]
