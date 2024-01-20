FROM node:21 as app

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY .env ./
ADD src ./src

RUN apt update

RUN rm -rf node_modules
RUN npm install 
RUN npm run build

COPY . ./
