FROM node:16.14.0

COPY --from=golang:1.17.7 /usr/local/go/ /usr/local/go/
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /usr/app/golang-interactive-shell

COPY package.json .

RUN npm i -g npm@latest
RUN npm i

COPY . .

CMD ["npm", "start"]