FROM node:12-stretch as base

ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /sbin/tini
RUN chmod +x /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]

RUN mkdir /www
WORKDIR /www

FROM base as builder

COPY package*.json ./

RUN npm install

COPY src/ src/

FROM base AS release

COPY --from=builder /www .

ENV NODE_ENV=production

EXPOSE 4000

#USER node

CMD ["node", "src/app.js"]
