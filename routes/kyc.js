/** @format */

import express from "express";
import multer from "multer";

import { extractKtpController } from "../controllers/extractKtpController.js";
import {
	getAllKycController,
	getVerificationResultsController,
	verifyNikController,
} from "../controllers/kycController.js";
import { verifyKtpController } from "../controllers/verifyKtpController.js";

const router = express.Router();
const upload = multer();

router.post("/verify-nik", upload.none(), verifyNikController);
router.get("/all", getAllKycController);
router.get("/verification-results", getVerificationResultsController);
router.post("/extract-ktp", upload.single("file"), extractKtpController);
router.post(
	"/verify-ktp",
	upload.fields([
		{ name: "file_ktp", maxCount: 1 },
		{ name: "file_selfie", maxCount: 1 },
	]),
	verifyKtpController,
);

export default router;
