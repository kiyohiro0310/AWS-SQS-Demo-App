FROM node:20-alpine AS API_BUILDER

WORKDIR /usr/src/sqs_demo

COPY ./backend ./backend

RUN cd backend && npm install && npm run build

FROM node:20-alpine

WORKDIR /usr/src/sqs_demo

COPY --from=API_BUILDER /usr/src/sqs_demo/backend/dist ./dist
COPY --from=API_BUILDER /usr/src/sqs_demo/backend/node_modules ./node_modules
COPY ./backend/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main"]