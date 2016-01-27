FROM node:5.5.0

# Install app dependencies
COPY package.json /src/package.json
RUN cd /src; npm install

# Bundle app source
COPY . /src

EXPOSE  9090
CMD ["node", "/src/app.js"]