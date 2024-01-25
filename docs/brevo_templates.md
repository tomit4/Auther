### Brevo Email Templates

### Getting an API Key

It's assumed that you have already signed up for [Brevo's Email API Service](https://app.brevo.com/).
I'll simply refer you to Brevo's official docs on [Creating And Managing Your API Keys](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys).
As always, ensure that all API keys are placed inside .env files (in our case inside of the backend/.env file), and that the .env file is listed in our .gitignore list.

### Setting Up Email Templates

Auther requires the use of four email templates, one for sign up, one for forgot
password, one for change password, and one for delete profile. Each of these
templates has a custom message reflecting the user's request.

Once logged into Brevo, on the left hand dashboard, you'll notice a field called
"Templates". Navigate there and you will be presented with a main dash board
table which listed out your templates. Navigate to and click on The New Template Button in the top right
hand corner.

<img src="https://github.com/tomit4/auther/blob/main/docs/assets/brevo_docs_01.png">

This will present you with a short template form to fill out. Most
can be left blank, but Template Name (Signup), Subject Line (My Test Email), as
well as the From Email (your individual/company email), and From Name(generic name) fields should be filled out.

Once done, hit the "Next Step" button in the upper right hand corner.

From here, you'll then be presented with a series of template designs. For
simplicity's sake, choose the "Start from scratch" option. Once done, hit the
"Save & Activate" button in the upper right hand corner to proceed.

On the next page, on the left hand side of the screen, you'll then be presented
with a series of elements you can choose to drag and drop into place on a blank template page.
Choose the "Text" option, drag it to the right side of the browser window and write a simple message like "Thanks for Signing Up. Please Click The Link Below to Navigate Back to App!"

Once completed, click and drag the "Button" element on the left hand of the
screen to the right template and hover it just below the text you wrote, you
should see a small highlighted blue bar where you are indicated to "drop"(stop
dragging) the element onto the page. A blue "Call to action" button will appear
below your text. Click on the button now to receive a series of small icons, one
of which, on the top, looks like a series of interlocking links in a chain,
click on this option. You will then be presented with a form titled "Insert/edit" link.
Fill out this form. Most importantly, the Link target field should contain
specifically:

```
{{params.link}}
```

This is so that the confirmation link we send in this email is recognized by
Auther's frontend page router to send the user to the appropriate page upon
confirmation of the transactional email.

The Type of Link can be left as "Absolute link (URL)", and the Link title can be
whatever you'd like (although I recommend you name it according to its function
for semantic conventions and readability).

The order of establishing these templates does matter, so ensure that the first
template you create is the signup template (#1), the second template you create
is the change password template (#2), the third template you create is the
delete your profile template (#3), and lastly the fourth template you create is
the forgot your password template (#4).

This ensures they correspond with what the frontend of Auther expects when
redirecting back to the application occurs.
