# EduSpace API configuration

## Database changes

The API must be able to reach PostgreSQL before you sync the Prisma schema. This
project does not have a baseline migration history yet, so sync the schema against
the configured database before starting the API:

```sh
npx prisma db push
npx prisma generate
```

Student enrollments now select one scheduled class within each course cohort.
Sync this schema change against the configured database before using class
enrollment. Set each class's `startsAt` and `meetingUrl` (a YouTube video or live
stream URL) to enable the countdown and embedded stream in the student portal.
Each class/cohort can also have `cohortStartDate` and `cohortEndDate`. Manage these
dates and its YouTube link from the teacher/admin **Manage cohorts** page. Students
see cohort classes and embedded streams only for courses in which they are enrolled;
the dashboard countdown uses the first class time, or the cohort start date when no
class time has been set.

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
