/** @format */

import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import kycRoutes from "./routes/kyc.js";

dotenv.config();

const app = express();

app.use(
	cors({
		origin: "http://localhost:8080",
		credentials: true,
	}),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/v1/kyc", kycRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server jalan di http://localhost:${PORT}`);
});

export default app;
