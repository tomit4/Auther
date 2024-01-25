## Environment Variables

### Development

**Backend**

You'll find in the backend directory a sample env.local.sample file which
provides the necessary fields to be filled out. Some of these are relatively
straight forward while others are not. I'll take some time to cover each in some
detail:

- The DEV env is set mainly to let fastify know if you want to utilize https or
  not. If DEV is set to "false", then https will be used (see backend/src/config/index.ts).

```bash
# DEV ENV
# Set to true for when working locally outside of docker
DEV="true"
```

- The PORT env is pretty self explanatory, the port over which the fastify
  server is being served from:

```bash
# Backend Port Number
PORT=3000
```

- The HOST env is set to the classic "any" host, which is common when working
  within docker. My recommendation is to not adjust this variable unless you plan
  on serving the fastify server on the host machine rather than within docker or a
  local environment:

```bash
# Host Name
HOST="::"
```

- The REDIS_HOST env is also set in a similar fashion, however if hosting within
  docker, please utilize the `docker inspect backend_app_backend` command to
  determine which host redis is served under (look for backend-cache-1 and find
  the IPv4Address field).

```bash
# Redis Config
# Change to docker instance ip address if in staging
REDIS_HOST="::"
```

- The REDIS_PORT env can be left at the default 6379, or adjusted however you'd
  like.

```bash
REDIS_PORT=6379
```

- The REDIS_PASSWORD env is pretty self explanatory, set your redis cache
  password:

```bash
REDIS_PASSWORD="redis"
```

- The REDIS_SESSION_EXP env is used to set the expiration of session information
  in cache, it is a number which should reflect the value in the JWT_SESSION_EXP
  expressed in seconds:

```bash
REDIS_SESSION_EXP=60
```

- The REDIS_REFRESH_EXP, similarly, reflects the expiration time for longer
  lasting cached information, which should reflect the value in the
  JWT_REFRESH_EXP time in seconds:

```bash
REDIS_REFRESH_EXP=180
```

- The HASH_SALT env can be any hashed string you like, generated however you'd
  like. Auther does not store raw email strings, instead opting to hash the string
  using NodeJS's native crypto library (see backend/src/lib/utils/hasher.ts).

```bash
# Salt for Hashing
HASH_SALT="salt"
```

- The COOKIE_SECRET env can similarly be configured using any reasonably lengthy
  randomly generated string used to secure cookies that are to be sent between the
  two ends of the application.

```bash
# Cookie Secret
COOKIE_SECRET="cookie_secret"
```

- The JWT_SECRET env, again, very much like the COOKIE_SECRET and HASH_SALT env
  variables is utilize to ensure that the JWT's are secure, make sure you choose a
  reasonably difficult to guess secret for your JSON Web Tokens:

```bash
# JWT Secret
JWT_SECRET="jwt_secret"
```

- The JWT_SESSION_EXP and JWT_REFRESH_EXP are the expiration times set for our
  JSON Web tokens. See the official [@fastify-jwt](https://github.com/fastify/fastify-jwt) for further documentation. You may set these however you like, though I recommend short expiration times when working in development in order to test them. The only requirement is that the session token's expiration time always be set to less than the refresh token's expiration time:

```bash
JWT_SESSION_EXP="1m"
JWT_REFRESH_EXP="5m"
```

- Similar to the REDIS_HOST, the PG_HOST configures the host ip of the postgres
  instance, if working locally in development, simply leave it as "::". Otherwise,
  if the postgres instance is running within docker, you'll need to find the
  ip address using the aforementioned `docker inspect backend_app_backend`
  command and looking for the `backend-db-1` IPv4Address field and put that here:

```bash
PG_HOST="::"
```

- The PG_PORT env can be left as the default:

```bash
PG_PORT=5432
```

- For security purposes, ensure that your PG_USER, PG_DB, and PG_PASS env
  variables are set accordingly. Use strong passwords:

```bash
PG_USER="postgros"
PG_DB="postgros"
PG_PASS="postgros"
```

- The BREVO_KEY env variable is where you will paste your API key you receive from
  Brevo. See [Create And Manage Your API Keys](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys) on their official website. Once you have established an API key, copy it here:

```bash
# Brevo Transactional Email API key
BREVO_KEY="your brevo key goes here"
```

- The BREVO_LINK is the host and port number of your frontend. If working in local
  development, this usually is the default of "localhost:5179" set by Vite. Again,
  however, if running within docker, you'll need to consult the `docker
inspect backend_app_backend` for the `frontend-app-1` IPv4Address field to
  find the host (though the port number of 5179 is likely to stay the same unless
  you explicitly tell Vite not to use the default). Note that this is
  related to setting up {{params.link}} in a button field on your various
  templates (see Brevo_Templates.md).

```bash
# Change this to frontend production server
# replace with ip address and port number of frontend if in docker
BREVO_LINK="localhost:9999"
```

- The various BREVO..TEMPLATE_ID env variables refer to the email templates set
  up on Brevo's website. See Brevo_Templates.md for more details regarding these
  variables and how to set up Brevo for proper use with this application.

```bash
# Change this if different template made via Brevo
BREVO_SIGNUP_TEMPLATE_ID=4
BREVO_CHANGE_PASSWORD_TEMPLATE_ID=5
BREVO_DELETE_ACCOUNT_TEMPLATE_ID=6
BREVO_FORGOT_PASSWORD_TEMPLATE_ID=7
```

- The TEST_EMAIL and TEST_EMAIL env variables can actually be left as is, as
  they are utilized soley for unit testing:

```bash
# Variables for ava tests, will actually send email and set user in DB
TEST_EMAIL="jondoe@example.com"
TEST_PASSWORD='Password1234!'
```

- The DOCKER_SUBNET env variable sets the main ip address on which the backend
  app will run within the docker network

```bash
DOCKER_SUBNET="127.00.0.0/11"
```

**Frontend**

- There are a multitude of variouis VITE\_..\_ROUTE env variables used to
  communicate with the backend. The only thing you'll need to change is the port
  number you chose for your backend to run on:

```bash
VITE_EMAIL_ROUTE="http://localhost:4848/onboarding/signup"
VITE_VERIFY_ROUTE="http://localhost:4848/onboarding/verify"
VITE_AUTH_ROUTE="http://localhost:4848/onboarding/auth"
VITE_REFRESH_ROUTE="http://localhost:4848/onboarding/refresh"
VITE_LOGIN_ROUTE="http://localhost:4848/onboarding/login"
VITE_LOGOUT_ROUTE="http://localhost:4848/onboarding/logout"
VITE_USERID_ROUTE="http://localhost:4848/onboarding/grab-user-creds"
VITE_CHANGE_PASSWORD_ASK_ROUTE="http://localhost:4848/onboarding/change-password-ask"
VITE_CHANGE_PASSWORD_ROUTE="http://localhost:4848/onboarding/change-password"
VITE_DELETE_PROFILE_ASK_ROUTE="http://localhost:4848/onboarding/delete-profile-ask"
VITE_DELETE_PROFILE_ROUTE="http://localhost:4848/onboarding/delete-profile"
VITE_FORGOT_PASS_ASK_ROUTE="http://localhost:4848/onboarding/forgot-password-ask"
VITE_FORGOT_PASS_CHECK_ROUTE="http://localhost:4848/onboarding/forgot-password-check"
VITE_FORGOT_PASS_CHANGE_ROUTE="http://localhost:4848/onboarding/forgot-password-change"
```

- The VITE_INVALID_TOKEN_CODE is meant to be set to "FASTIFY_JWT_EXPIRED", as
  this will explicitly silent the error message sent from the backend when the
  refresh token has expired. This is admittedly a bit of a hacky work around to
  not notify the user specifically when their session has expired and instead
  simply to send them back to the login page:

```bash
VITE_INVALID_TOKEN_CODE="FASTIFY_JWT_EXPIRED"
```

- Similar to the backend, the VITE_TEST_EMAIL and VITE_TEST_PASSWORD env
  variables are meant to be utilized with [Vitest](https://vitest.dev/) for
  unit/integration tests. The VITE_TEST_HASH env variable serves a similar
  function. There's no need to change these:

```bash
VITE_TEST_EMAIL="jondoe@example.com"
VITE_TEST_PASSWORD="Password1234!"
VITE_TEST_HASH="reallyreallylonghash"
```

- The DOCKER_PORT env variable sets the port on which the frontend will be
  served from. Thusly in your browser, when all docker containers are up and
  running, you can go to the ip address of the frontend-app (preceded by https),
  and then this port number, and you should be presented with the application.

```bash
DOCKER_PORT=6969
```

### Staging

I'll simply provide a note here to say that there are also env.dist.sample files
which reflect the slight differences between the development and production
environment variable settings. The most stark difference are the frontend routes
which reference the backend. You'll notice that it does not include the host or
port number. This is because the entire Auther application is running on the
same docker network and thusly it is referencing all routes starting with /onboarding.
