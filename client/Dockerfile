FROM node:22 as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# Allow overriding API base at build (default to empty to use Nginx proxy path '/api')
ARG REACT_APP_API_URL=""
ENV REACT_APP_API_URL=$REACT_APP_API_URL
COPY . .
RUN npm run build

# Use Nginx to serve the static production build
FROM nginx:alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]