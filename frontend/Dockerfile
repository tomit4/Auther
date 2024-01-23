FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY security/ /etc/nginx/ssl/

WORKDIR /usr/share/nginx/html

COPY dist/ .

CMD ["nginx", "-g", "daemon off;"]
