FROM node:18
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci --production=false
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev"]
