FROM node:lts-slim

WORKDIR /app

COPY backend-app .


RUN groupadd bob && \
    useradd -g bob bob

USER bob

EXPOSE 3000
CMD [ "node", "server.js" ]