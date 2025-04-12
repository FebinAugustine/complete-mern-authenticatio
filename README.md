<h1 align="center">Advanced Auth Tutorial 🔒 </h1>

![Demo App](/frontend/public/Thumbnail-for-readme.png)

About This Course:

- 🔧 Backend Setup
- 🗄️ Database Setup
- 🔐 Signup Endpoint
- 🚪 Logout Endpoint
- 🔑 Login Endpoint
- 🔄 Forgot Password Endpoint
- 🔁 Reset Password Endpoint
- ✔️ Check Auth Endpoint
- 📧 Sending Verify Account Email
- 🔍 Verify Email Endpoint
- 📄 Email sending with nodemailer and building a Welcome Email Template
-
- 🌐 Frontend Setup
- 📋 Signup Page UI
- 🔓 Login Page UI
- ✅ Email Verification Page UI
- ✅ Forgot Password Page UI
- 🏠 Dashboard Page
- 📤 Implementing Signup
- 📧 Implementing Email Verification
- 🔒 Protecting Our Routes
- 🔑 Implementing Login
- 🔄 Implementing Forgot Password
- 🚀 Deployment to Render.com
- ✅ This is a lot of work. Support my work.

### Setup .env file

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV="production"
MODE="development"


# JWT TOKEN
ACCESS_TOKEN_SECRET="YourSecret"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_SECRET="YourSecret"
REFRESH_TOKEN_EXPIRY="7d"

# For nodemailer
MAIL_SENDER_MAIL="youremial@gmail.com"
APP_PASSWORD="YourAppPassword"

# DATABASE CONNECTION
# MongoDB
MONGODB_URI = "Your Mongo db connection string"

# Upstash Redis
UPSTASH_REDIS_URL=Your Upstash URL

```

### Run this app locally

```shell
npm run build
```

### Start the app

```shell
npm run start
```

### I'll see you in the next one! 🚀
