# Fetching the minified node image on apline linux
FROM node:slim

# Setting up the work directory
WORKDIR /app

COPY package*.json ./

# Installing dependencies
RUN npm install

# Copying all the files in our project
COPY . .

# Starting our application
CMD [ "node", "app.js" ]

# Exposing server port
EXPOSE 3000