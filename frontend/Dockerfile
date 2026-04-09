FROM node:20-alpine AS BUILD_WEB

WORKDIR /usr/src/sqs_demo

COPY ./frontend ./frontend

RUN cd frontend && npm install && npm run build

FROM nginx:alpine

COPY --from=BUILD_WEB /usr/src/sqs_demo/frontend/dist /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]