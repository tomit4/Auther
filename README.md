## Auther

### Introduction

Auther is a scaffolding project which demonstrates the basic concepts around
authentication using JSON Web Tokens and 2 factor authentication using transactional emails.
Meant to be put in front of any application that needs authentication, Auther
aims to provide the basic features of authentication (sign up, login, forgot
password, change password, delete profile) that users have come to
expect to be a part of any modern day application.

#### The Why

While there are many out of the box options for working with authentication such
as [Auth0](https://auth0.com/) and [Oauth](https://oauth.net/2/), for smaller
applications and beginner developers, often attempts at understanding the basics
of authentication using JSON Web Tokens(JWTs) can sometimes seem elusive.

Thusly, Auther is mean to demonstrate the essentials at the basic concepts
around JWT authentication utilizing simple tools utilized in modern applications
today.

Make no mistake, Auther is a very opinionated solution to integrating
authorization into any existing application, as it utilizes a myriad of my
personally preferred tools for building my personal projects.

Nevertheless, should your choice of tools align closely with mine, or should you
wish to understand the basics of authentication using JWT, I invite you to take
a closer look at Auther, its logic, and what it has to offer.

#### The What

On its surface, Auther simply provides the user with a sign up form asking for
their email, and a password. Once the email is answered, the user is brought
back to the application page and logged in, where they are presented with a
minimal dashboard. This includes buttons which can log out, change password, or
delete profile for the user.

Once the user has signed up, they may sign in using their email and password to
return to the same dashboard after they have either logged out or their session
has expired.

#### Under The Hood

Auther is written in [TypeScript](https://www.typescriptlang.org/) for both the backend and the frontend sides of the application. It utilizes [NodeJS](https://nodejs.org/) with the [Fastify Framework](https://fastify.dev/), along with the [Knex Query Builder](https://knexjs.org/), [Postgres](https://www.postgresql.org/), and [Redis](https://redis.io/) on the backend. On the frontend it utilizes [VueJS](https://vuejs.org/), bundled by [Vite](https://vitejs.dev/). It also makes heavy use of the [Brevo Transactional Email API](https://vitejs.dev/).

Additionally, Auther provides a series of scripts and configuration files to
containerize the project into a series of [Docker]() containers, all within a
single [docker network]() so as to be pushed into staging, and eventually,
production.

#### Required Knowledge

Auther, unfortunately, requires a decent amount of configuration to get started,
including the setting of multiple environment variables depending on
whether you are working in development or staging. Additionally, one must
acquire an [API key from Brevo](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys) multiple [email templates](https://help.brevo.com/hc/en-us/articles/360019787120-Create-an-email-template) must first be in place on one's Brevo' account (all are available on their free tier).

This is not a beginner's project (though not particularly advanced either).
Should you choose to install and play around with Auther, please be advised that
it is highly recommended that you already be familiar with the basic flow of
CRUD applications. It is also highly advised that you already have a decent
understanding of Git, JavaScript, SQL, Redis, and Docker. This project doesn't
utilize advanced features of any of these, but it is still advised you have more
than a passing familiarity with them.

#### Installation

**Required Packages**
I will not provide in this README the installation instructions for the
following, but it is expected you already have them running on your host
machine. You will need the following already installed and/or running:

- nodejs/npm
- postgresql
- redis
- docker (if planning to put this to staging)

**Development**

1. Clone this repository:

```
git clone "https://github.com/tomit4/auther"
```

2. Install all packages via npm

```
cd auther/backend && npm install && cd ../frontend && npm install
```

3. Edit your .env files. Provided within both the frontend and backend
   directories are some sample env files which you should copy and edit
   according to which ports you wish to use for the backend as well as
   environment variables central to interacting with the Brevo API (see below
   for details).

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

### Environment Variables

- See the [env_vars.md](./env_vars.md) document for details on how to set up your environment
  variables.

### Brevo Email Templates

- See the [brevo_templates.md](./brevo_templates.md) document for details on how
  to set up the transactional email forms for Auther.

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

### Docker Orchestration

Once ready to start staging for production, ensure you have generated local ssl
certs as instructed to above. Once you have a security directory both within the
backend and frontend directories containing these generated ssl certs, simply
invoke the provided dockerify script to spin up the various docker containers.
This will invoke the docker-compose.yml and Dockerfile scripts in both the backend
and frontend directories, which orchestrates the creation of a Postgres, Redis,
NodeJS, and NGINX servers. Inspect that they are all running using the `docker
ps` command. If all is looking well. Utilize the `docker inspect
backend_app_backend` command to determine which ip address is running the
frontend. This can be found under the `frontend-app-1` IPv4Address field.

Once found, navigate there in your browser (make sure to use https). You should
see the splash page ready to either sign up or login.

### Production

This project is not live on the internet as it is only a POC of authentication,
and I don't want to be responsible should anyeone stumble upon it, create
an account, find there's no app behind it, and leave their sensitive
information on my VPS (see A Word of Warning below). However, for documentation
purposes, I will briefly cover here the simple strategy of setting this up on
the internet.

Ensure you have a rented nanode on Linode/Akamai or a droplet on Digital Ocean
set up (or any other VPS provider for that matter). Also ensure you have a domain
purchased on NameCheap or other domain registrar.

Ensure that nginx is set up and running as a daemon in the background.

You'll also need to have the staged docker containers running as instructed
above. Once all docker containers are running, reverse proxy the exposed
frontend host/port to the host NGINX server.

Utilize certbot to establish an ssl certificate and follow your VPS instructions
on how to establish the CNAME records on your domain registrar.

Yeah, I know I didn't go into detail, sorry but if you don't know how to do
this, you'll have to do your own research. There are plenty of resources online
on how to do this, so don't get discouraged...but also don't do this for this
particular project, Auther is not secure.

### Scaffolding Onto Auther

Auther is not meant to be a fully fledged application, instead it is meant
simply as a POC. It is simply one way of implementing the basic features of
JWT authentication common to modern applications. Should you, like me, enjoy
working with this particular tech stack for development, then you can start
adding features behind Auther's authentication page.

Firstly, you'll probably want to extend the time of the JWT_SESSION_EXP and
JWT_REFRESH_EXP variables so that you can easily work on your application
without the session timing out.

**Scaffolding The Front End**

Auther does not make any opinions on where the authentication buttons/links
should go, and thusly it is placed just smack dab in the middle of the page. For
my personal projects, I plan on putting these buttons in a navigation panel.
Until I update this project with further features, you'll have to style the
AppView.vue file (see frontend/src/views/AppView.vue) to achieve this.
Incidentally, the AppView.vue file is the entry point to the expected
application, and this is where I'd advise starting work on any page you
that requires authentication.

**Scaffolding The Back End**

Auther's backend is organized in an opinionated fashion, and utilizes tools like
KnexJS and Redis for DB and caching services. Additionally, Fastify's design
around "everything is a plugin" requires some familiarity with their ecosystem
in order to understand how best to scaffold off of. I recommend however, that
you follow similar paradigms to the ones already in place (establishing
db/caching logic within an abstracted service file, to be exported and
registered as a plugin with fastify).

NOTE: A word on routing, when working within docker, because this application
runs on a single docker network, it is imperative that the names of routes do
not overlap. Thusly, you cannot have an 'onboarding' route established in the
frontend's router/index.ts file, as that would conflict with the onboarding
routes found on the backend.

### A Word of Warning: Auther Is Only a POC

It is imperative that should you choose to utilize Auther as your
Authentication strategy (with all the opinionated choices made), you must know
that Auther is made more as a POC than a legitimate authorization strategy.
Auther was made for me to learn this particular tech stack and also to solidify
my own personal understanding of JWT authentication strategies.

I believe Auther like common SQL injection attacks (as good as KnexJS strategies),
common XSS attacks (as good as VueJS's http purification strategies). It also
utilizes rate-limiting and input verification on both back and front end to
ensure bad inputs are invalidated.

Additionally, the use of docker networks to ensure there is only one point of
entry to the application (i.e. no exposed ports except for the front end are
available to curl on the world wide web).

Lastly, all passwords are hashed/salted using bcrypt, and no passwords are saved
in plain text, as they are also hashed as well before being stored in the db
(though the redis cache does indeed temporarily hold onto the raw email).

While I personally am unable to figure out how to hack this login form, I am no security
expert, and therefore cannot advise the use of Auther on any large applications (or even
small applications for that matter). Again, this is simply a POC to demonstrate
the basic ideas around authentication using JWTs.

In short, should you utilize Auther as your authentication strategy (and tech stack)
of choice, please know that you do so at your own risk. Auther is written by
some random web developer on the internet, and not to be considered as
trustworthy a solution as other more well known authentication SDKs.

### Constructive Criticism/Advice

Please feel free to write an issue or create a pull request should you desire
to. Again, Auther is solely a POC, but one that I hope to be a good
demonstration of the basics around JWT authentication.

I am always learning, and want to learn more about this topic. If you have some
constructive criticism or advice to give, please feel to reach out to me here on
Github. Alternatively, you can reach me on LinkedIn or Mastodon.

**V3_TODOS:**

- [ ] Refactor remaining utility functions into their own classes (will require
      rewriting of some unit tests)
- [ ] Integrate basic CI/CD using GH actions and drone.yml
