import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "../emailSender/emailTemplates.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_SENDER_MAIL,
    pass: process.env.APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (email, verificationCode) => {
  const mailOptions = {
    from: {
      name: "My Project",
      address: process.env.MAIL_SENDER_MAIL,
    },
    to: email,
    subject: "Verification Email",
    text: "This is to verify your account",
    html: VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationCode
    ),
    category: "Email Verification",
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification`, error);
    throw new Error(`Error sending verification email: ${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: {
      name: "My Project",
      address: process.env.MAIL_SENDER_MAIL,
    },
    to: email,
    subject: "Welcome Email",
    text: "Welocome, you have successfully verified your account",
    html: WELCOME_EMAIL_TEMPLATE.replace("{senderName}", name),
    category: "Welcome Email",
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully", response);
  } catch (error) {
    console.error(`Error sending welcome email`, error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const mailOptions = {
    from: {
      name: "My Project",
      address: process.env.MAIL_SENDER_MAIL,
    },
    to: email,
    subject: "Reset your password",
    text: "This is to verify your account",
    html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    category: "Password Reset",
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset email`, error);
    throw new Error(`Error sending Password Reset email: ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  const mailOptions = {
    from: {
      name: "My Project",
      address: process.env.MAIL_SENDER_MAIL,
    },
    to: email,
    subject: "Reset your password",
    text: "Password Reset Successful",
    html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    category: "Password Reset Successful",
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset email`, error);
    throw new Error(`Error sending Password Reset email: ${error}`);
  }
};
