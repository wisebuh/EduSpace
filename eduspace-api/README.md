# EduSpace API configuration

## Database changes

The API must be able to reach PostgreSQL before you sync the Prisma schema. This
project does not have a baseline migration history yet, so sync the schema against
the configured database before starting the API:

```sh
npx prisma db push
npx prisma generate
```

Assignment attachments and uploaded student submissions add columns to the Prisma
schema. Sync the schema and regenerate the client before using assignment-file
uploads, downloads, or grading for uploaded work. Files are stored on the API
server under `uploads/materials`.

Student enrollments now select one scheduled class within each course cohort.
Sync this schema change against the configured database before using class
enrollment. Set each class's `startsAt` and `meetingUrl` (a YouTube video or live
stream URL) to enable the countdown and embedded stream in the student portal.
Each class/cohort can also have `cohortStartDate` and `cohortEndDate`. Manage these
dates and its YouTube link from the teacher/admin **Manage cohorts** page. Students
see cohort classes and embedded streams only for courses in which they are enrolled;
the dashboard countdown uses the first class time, or the cohort start date when no
class time has been set.

Assignments are listed for the class cohort the student is enrolled in. Student
attendance check-in opens 10 minutes before the scheduled class start and closes
15 minutes after it; a class start time must be set. Certificates remain unavailable
until the cohort end date has passed and the attendance and assignment requirements
are met.

The weighted course grade is four assignments at 7.5% each (30% total), attendance
at 20%, and a teacher-entered exam score at 50%. Cohorts allow up to four graded
assignments; projects remain separately graded and do not contribute to this total.
The exam score is stored on the enrollment record, so sync the Prisma schema before
using the exam grader.

## Creating an administrator

Admin accounts sign in with an email address. With the API database configured and
reachable, create a new administrator with:

```sh
npm run admin:create -- louismerit3@gmail.com
```

The command refuses to overwrite an existing account and prints a randomly
generated one-time password only after successfully creating the administrator.
Store it securely and change it after the first sign-in.

## Teaching updates and notifications

Teachers and admins can publish assignments, upload course materials, and post
course announcements from the teaching tools. Students receive persisted in-app
notifications and email for these events only when they are enrolled in the
relevant class or course. In-app notifications are available from the dashboard
bell; email delivery respects each user's **Email notifications** preference.
Configure `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` (and SMTP credentials when
required) to send notification email. In-app notifications continue to work if
SMTP is not configured.

## Email verification

Registration sends a one-time verification link. Password sign-in is rejected until
the email address has been verified. Configure `SMTP_HOST`, `SMTP_PORT`, and
`SMTP_FROM`; configure `SMTP_USER` and `SMTP_PASSWORD` when the SMTP server requires
authentication. Set `SMTP_SECURE=true` only when the SMTP server expects implicit
TLS (commonly port 465); use `false` for STARTTLS (commonly port 587).

Copy `.env.example` to `.env` and replace the example values. The verification URL
uses `CLIENT_URL` and expires after 30 minutes. Google sign-in remains verified by
Google's verified-email claim.

## Google sign-in

Create an OAuth 2.0 Web application client in Google Cloud Console. Add the exact
value of `GOOGLE_CALLBACK_URL` (by default,
`http://localhost:4000/api/auth/google/callback`) to its authorized redirect URIs.
Set the resulting `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in this API's
`.env`; the client ID must be the Google-generated ID ending in
`.apps.googleusercontent.com`. Do not expose the secret in the web app or commit
either value. Restart both the API and web app after changing environment
configuration. The sign-in screen reads Google sign-in availability from the API.
Leave both values empty to disable Google sign-in without preventing the API from
starting; configure both valid values to enable it.
