FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY security/ /etc/nginx/ssl/

WORKDIR /usr/share/nginx/html

COPY dist/ .

EXPOSE 6969

CMD ["nginx", "-g", "daemon off;"]
