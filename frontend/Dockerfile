FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

COPY dist/ .

EXPOSE 6969

CMD ["nginx", "-g", "daemon off;"]
