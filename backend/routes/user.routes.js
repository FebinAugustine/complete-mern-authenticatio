import { Router } from "express";
import {
  signin,
  signup,
  verifyEmail,
  logout,
  recreateAccesToken,
  forgotPassword,
  resetPassword,
  checkAuth,
  getUserDetails,
  updateUserDetails,
  updateUserPassword,
  updateUserAvatar,
  deleteUserAccount,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.get("/check-auth", verifyToken, checkAuth);
router.post("/get-user-details", verifyToken, getUserDetails);
router.post("/update-user-details", verifyToken, updateUserDetails);
router.post("/update-password", verifyToken, updateUserPassword);
router.patch(
  "/update-user-avatar",
  verifyToken,
  upload.single("avatar"),
  updateUserAvatar
);
router.post("/delete-user-account", verifyToken, deleteUserAccount);

router.route("/signup").post(signup);
router.post("/verify-email", verifyEmail);
router.post("/signin", signin);
router.post("/logout", logout);
router.post("/recreate-access-token", recreateAccesToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
