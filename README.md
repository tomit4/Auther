## Vite + Vue + NGINX

### Introduction

This simple project is simply an experimentation in how Vue-Router's Page
Routing Logic, Brevo's Transacitonal Email API, and also NGINX interact. The
plan is to eventually expand this out as a scaffolding for a project
incorporating login via logic involving jwt, trasac email, redis caching, and
db storage via mariadb.

#### The Why

As a beginner web developer, putting things into actual development is sometimes
a mystery. With services like Github Pages, Netlify, and many others, it
sometimes can seem like we simply push our development code up to a magic place
in the cloud, and voilà, our site is live on the internet!

I've endeavored to dive just a tiny bit deeper and host my sites on my own VPS.
At the time of this writing (12/06/2023), I have only deployed a basic node
backend via docker and nginx, as well as a simple blog website written in HTML,
CSS, and JavaScript also served via docker and nginx.

While I have played around with VueJS and ReactJS in development, I have not
actually released a production application in either Framework, and it occurred
to me that routing might have some caveats since NGINX looks directly for files
in various directories when working with a traditional HTML/CSS/JS website.

This proved not to be too difficult, as it required a single line in the NGINX
config to resolve the issue. This might not be worth writing extensively about,
but nevertheless I am committing this small repository as a good starting point
for a simple project.

#### The What

This project provides a one step Onboarding Form that simply asks for an email.
Once the email is entered, it is sent back to a simple HapiJS server which
utilizes the Brevo Transactional Email API to send an email (template set up
directly on Brevo's website, requires API key and writing a simple
template with a button that sends via a parameter called {{params.link}}.

This email, if received and properly formatted via their online interface,
should lead the user back to the the application with a simple confirmation that
they've answered the email and "been verified" (currently no authentication,
authorization, or verification is actually implemented).

#### Installation

**Development**

1. Clone this repository:

```
git clone "https://github.com/tomit4/vite_via_nginx"
```

2. Install all packages via npm

```
cd vite_via_nginx/backend && npm install && cd ../frontend && npm install
```

3. Edit your .env files. Provided within both the frontend and backend
   directories are some sample env files which you should copy and edit
   according to which ports you wish to use for the backend as well as
   environment variables central to interacting with the Brevo API.

4. Once installed, start each server, usually done through two different
   terminal windows:

```
# backend
npm run start
```

```
# frontend
npm run dev
```

4.  Navigate To The Onboarding Site in your browser(default vite port): localhost:5173/onboarding

5.  Fill out the Email form.

6.  Check your Email Inbox, if you filled out your Brevo API keys, as well as
    created the template on their website correctly, you should receive an email
    with a button with a simple call to action. Click the link/button.

You should now be returned to the application page confirming you've fulfilled
the transactional email request.

**Production**

I have provided a sample nginx.conf in the root directory of the project under
the config directory. This is a bare minimum nginx.conf that should not actually
be used in production, but will work as an example for what to append to your
hopefully more extensive nginx.conf you already have.

Of particular importance is the line:

```
try_files $uri $uri/ /index.html;
```

This is taken directly from the Vue-Router website. To get this working on
NGINX, you of course, must have NGINX installed on your development machine. I
personally work on an Arch Linux based distribution, so while the pathnames may be a
bit different, the concepts around NGINX remain similar between Linux
distributions. Consult your specific distros documentation on NGINX to find where
your default nginx.conf files exist.

On Arch Linux, those files can be found in /etc/nginx. There you will find a
default nginx.conf file. Navigate there and make a backup of the default, we
will be replacing it for the purposes of this demonstration:

```
cp nginx.conf nginx.conf.bak
```

Next copy the sample nginx.conf provided with this project to your /etc/nginx/
directory.

```
cp vite_via_nginx/config/config/nginx_example.conf /etc/nginx/nginx.conf
```

Finally restart nginx so that it will load this new configuration file:

```
systemctl restart nginx
```

Navigate to the port specified within the nginx_example.conf (now your
nginx.conf) and you should see the home screen. Navigate to the onboarding route
and follow the steps above in the Development section to ensure everything is
working as expected.

### Conclusion

While this is essentially a trivial application meant solely to demonstrate how
to set up Vue-Router with NGINX in production, as well as with the added nicety
of interacting with the Brevo Transactional Email API, I felt it was worthwhile
to document this simple project as it might prove useful to myself (and possibly
others) in the future when starting out on a basic project that utilizes
these tools.

**SIGNUP LOGIC**

- Once the user has entered their email and password,
  A unique hash token representing their temporary credentials is established in
  redis, this stores a hash of their email as well as their password encrypted
  using bcrypt. This has an expiration time of a few hours (up to 24 hours or so).

- The transactional email using Brevo holds a variable known as params.link, which
  should send them back to our application url with the same hash email in the
  url.

- Upon arrival back at the application at this specified url, the hash is sent to
  the backend where it is checked against the redis store.

- If the hash exists, a jwt is established, that jwt is hashed and then sent back
  as a cookie to the client in the headers to be used as a login (this is
  indicative of how login will be covered as well). Additionally,
  the user's hashed email and encrypted password is then stored in the SQL
  database (either mariadb or postgresql) for future logins.

**TODOS**

- [x] Convert project over to typescript as practice
- [x] Investigate caching (i.e.redis)
- [x] Set up knex/postgresql following [this tutorial](https://www.basedash.com/blog/how-to-configure-knex-js-with-typescript)
- [x] Incorporate postgresql with knex query builder for very basic db integration,
      allow for secure storage of hashed email addresses and associated usernames,
      dates of sign up, etc.
- [x] Expand example to include jsonwebtoken/login demonstration
- [x] Heavily refactor both back end and front end so there isn't so much
      repeated logic
- [x] Integrate Ava Unit Testing with nyc output on backend
- [x] Utilize Vitest for E2E testing. Consider starting with [this basic
      tutorial](https://blog.logrocket.com/guide-vitest-automated-testing-vue-components/) and also read [the official docs](https://vitest.dev/guide/)
- [x] After looking over Vitest, consider whether this is robust enough, or to
      use a more commonly used E2E testing library like [Playwright](https://playwright.dev/)
- [ ] Address any remaining TODO notes within the code base
- [ ] Dockerize each service separately and investigate docker networking so
      that each container can "talk" to each other via externalized ports
- [ ] Consider utilizing kubernetes to orchestrate docker containers
- [ ] Integrate basic CI/CD using GH actions and drone.yml

**V3_TODOS:**

- [ ] Refactor remaining utility functions into their own classes (will require
      rewriting of some unit tests)

### Generating SSL Certs For Use Within Docker

Because the fastify server sends secure https only cookies, when the server is
finally virtualized inside of a docker container, both the frontend and backend
servers must have ssl certificates to enable https, otherwise the
authentication strategies will fail and the user will always be redirected back
to login (email signup still works until you actually log in).

I have provided a sample CA.cnf file as well as a localhost.cnf file within the
security directory to be utilized with an gencert bash script to generate these
certificates. Once the appropriate localhost_cert.pem and localhost_key.pem files
have been generated, you simply have to copy this security directory directly
within both of the backend and frontend directories prior to running the
dockerify script. The gencert script is not of my own making, but rather is
based off of [this stackoverflow post](https://stackoverflow.com/questions/66558788/how-to-create-a-self-signed-or-signed-by-own-ca-ssl-certificate-for-ip-address).

As noted in some of the comments of this stack overflow post, this is not truly
a self signed certificate and only works because we are using it in a local
environment on docker. In actual production, SSL certificates are to be signed
by an official authority like [Let's Encrypt](https://letsencrypt.org) using
tools like [certbot](https://certbot.eff.org/).
