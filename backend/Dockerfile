FROM node

WORKDIR /usr/src/sqs_demo

COPY ./ ./backend

RUN cd frontend && npm install && npm run build