import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcrypt";
import fs from "fs";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../emailSender/emailSender.js";
import { User } from "../models/user.model.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshTokens.js";
import {
  storeRefreshTokenInRedis,
  deleteRefreshTokenInRedis,
  getStoredTokenFromRedis,
} from "../utils/storeRefreshTokenInRedis.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.fileuplaod.js";
import { setCookies } from "../utils/setCookies.js";

dotenv.config();

/* SIGN UP USER FUNCTION - TESTED*/
export const signup = async (req, res) => {
  /* Get user detail from frontend */
  const { fullName, userName, email, password } = req.body;

  try {
    /* validations: check 4 empty field - preffered way */
    if (
      [fullName, userName, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields Are Required." });
    }

    /* Checking If User with this Email Exist */
    const userWithThisEmailAlreadyExists = await User.findOne({ email });

    if (userWithThisEmailAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    /* Checking If User with this Username Exist */
    const userWithThisUsernameAlreadyExists = await User.findOne({ userName });

    if (userWithThisUsernameAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "User with this username already exists",
      });
    }

    /* Create a verification Code for user to verify the signup email. */
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    /* Create a new user and enter into mongoDb */
    const user = await User.create({
      fullName,
      userName: userName.toLowerCase(),
      email,
      password,
      verificationCode,
      verificationCodeExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    /* Check whether user is created by checking the id of the same. 
    If created then return the values except password and refresh token. */
    const newUserCreated = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    /* check for user creation */
    if (!newUserCreated) {
      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while creating and entering the user to DB",
      });
    } else {
      await sendVerificationEmail(user.email, verificationCode);
      res.status(201).json({
        success: true,
        message: "New user created successfully",
        user: newUserCreated,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* SIGN IN USER FUNCTION - TESTED */
export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    // password check

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Email or password is not correct" });
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
      user._id,
      email
    );

    await storeRefreshTokenInRedis(user._id, refreshToken);

    user.lastLogin = new Date();
    await user.save();

    setCookies(res, accessToken, refreshToken);

    const loggedInUser = {
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: loggedInUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* LOGOUT USER FUNCTION - TESTED*/
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const redisreturn = await deleteRefreshTokenInRedis(decoded.userId);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* VERIFY USER EMAIL FUNCTION - TESTED */
export const verifyEmail = async (req, res) => {
  const { verificationCode } = req.body;
  try {
    const user = await User.findOne({
      verificationCode: verificationCode,
      verificationCodeExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    } else {
      /* updating user verification status*/
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
    }

    /* Saving user after updating verification status*/
    const verifiedUser = await user.save();

    /* Verified user details */
    const newVerifiedUser = {
      fullName: verifiedUser.fullName,
      userName: verifiedUser.userName,
      email: verifiedUser.email,
      isVerified: verifiedUser.isVerified,
    };

    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name);

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully. Please check your mail for Welcome Email.",
      user: newVerifiedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Verification failed. Server error!" });
  }
};

/* RE-CREATE THE ACCESS TOKEN - TESTED */
export const recreateAccesToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await getStoredTokenFromRedis(decoded.userId);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Access Token refreshed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* FORGOT USER PASSWORD FUNCTION - TESTED */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* RESET USER PASSWORD FUNCTION - TESTED */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      },
      { new: true } // Return the updated document
    );

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* VERIFYTOKEN FOR CHECKING AUTHENTICATION - TESTED */
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* GET USER DETAILS FUNCTION - TESTED */
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const currentUser = {
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      dob: user.dob,
      role: user.role,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      message: "Current User Details Fetched",
      user: currentUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* UPDATE USER DETAILS FUNCTION -TESTED */
export const updateUserDetails = async (req, res) => {
  const { userName, fullName, email, phone, address, gender, dob } = req.body;

  if (!userName || !fullName || !email) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Create object with only changed fields
    const updatedUserDetails = {};

    // Check each field and add to update object if changed
    if (fullName !== user.fullName) updatedUserDetails.fullName = fullName;

    // Special handling for username with uniqueness check
    if (userName !== user.userName) {
      const existingUser = await User.findOne({
        userName,
        _id: { $ne: req.userId }, // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
      updatedUserDetails.userName = userName;
    }
    if (email !== user.email) updatedUserDetails.email = email;
    if (phone && phone !== user.phone) updatedUserDetails.phone = phone;
    if (address && address !== user.address)
      updatedUserDetails.address = address;
    if (gender && gender !== user.gender) updatedUserDetails.gender = gender;
    if (dob && dob !== user.dob) updatedUserDetails.dob = dob;

    // If no fields were changed
    if (Object.keys(updatedUserDetails).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes detected",
        user,
      });
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updatedUserDetails },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* UPDATE AVATAR OR COVER IMAGE FUNCTION - TESTED */
export const updateUserAvatar = async (req, res) => {
  try {
    // Debugging logs
    console.log("Request file:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const avatarLocalPath = req.file.path;
    console.log("Local file path:", avatarLocalPath);

    // Verify file exists locally
    if (!fs.existsSync(avatarLocalPath)) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file not found on server",
      });
    }

    // Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Cloudinary response:", avatar);

    if (!avatar?.url) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed - no URL returned",
      });
    }

    // Update database
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { avatar: avatar.url } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatarUrl: avatar.url,
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* UPDATE USER PASSWORD FUNCTION - TESTED */
export const updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "No user found." });
    }

    // update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUserPassword = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
        },
      },
      { new: true } // Return the updated document
    );

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password Updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* DELETE USER ACCOUNT FUNCTION - TESTED */
export const deleteUserAccount = async (req, res) => {
  try {
    // 1. Find the user to be deleted
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Delete user's avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        // Extract public_id from the avatar URL
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await deleteImageFromCloudinary(publicId);
        console.log(`Deleted avatar from Cloudinary for user ${user._id}`);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with account deletion even if avatar deletion fails
      }
    }

    // 3. Delete the user document from MongoDB
    await User.findByIdAndDelete(user._id);

    // 4. Clear authentication cookies/tokens if needed
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      error: error.message,
    });
  }
};
