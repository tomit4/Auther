## Vite + Vue + NGINX

### Introduction

This simple project is simply an experimentation in how Vue-Router's Page
Routing Logic, Brevo's Transacitonal Email API, and also NGINX interact.

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
distribution, consult your specific distros documentation on NGINX to find where
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

**TODOS**

- [ ] Dockerize the backend and adjust the backend server accordingly
- [ ] Expand example to include jsonwebtoken/login demonstration
