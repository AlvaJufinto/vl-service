/** @format */

import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";

import { createClient } from "@supabase/supabase-js";

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
const upload = multer();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.post("/v1/kyc/verify-nik", upload.none(), async (req, res) => {
	const { nik } = req.body;
	if (!nik) {
		return res.status(400).json({ error: "nik wajib diisi" });
	}
	try {
		// 1. Identity Verification (simulasi ZOLOZ)
		let identityScore = 0;
		let livenessScore = 0;
		let riskScore = 0;
		let complianceScore = 0;
		let decision = "";
		let reason = [];

		// Simulasi: NIK valid di database = identity 50
		const { data, error } = await supabase
			.from("kyc_ktp")
			.select("*")
			.eq("nik", nik)
			.single();
		if (error && error.code === "PGRST116") {
			return res.status(404).json({ error: "NIK tidak ditemukan" });
		}
		if (error) {
			return res
				.status(500)
				.json({ error: "Supabase error", detail: error.message });
		}
		if (!data) {
			return res.status(404).json({ error: "NIK tidak ditemukan" });
		}
		identityScore = 50;
		reason.push("NIK valid di database");

		// Simulasi: Liveness detection (random 25-30)
		livenessScore = Math.floor(Math.random() * 6) + 25;
		reason.push("Liveness detection sukses");

		// Simulasi: Risk analysis (IP/device, random 15-20)
		riskScore = Math.floor(Math.random() * 6) + 15;
		reason.push("Device/IP aman");

		// Simulasi: Compliance check (validasi NIK, random 0-5)
		complianceScore = Math.floor(Math.random() * 6);
		reason.push("Tidak terindikasi sanction list");

		// Final Trust Score
		const finalScore =
			identityScore + livenessScore + riskScore + complianceScore;
		if (finalScore >= 85) {
			decision = "Auto-Approved";
		} else if (finalScore >= 60) {
			decision = "Manual Review";
		} else {
			decision = "Auto-Rejected";
		}

		return res.status(200).json({
			nik: data.nik,
			nama: data.nama,
			tempat_lahir: data.tempat_lahir,
			tanggal_lahir: data.tanggal_lahir,
			jenis_kelamin: data.jenis_kelamin,
			alamat: data.alamat,
			rt: data.rt,
			rw: data.rw,
			kelurahan: data.kelurahan,
			kecamatan: data.kecamatan,
			kota_kabupaten: data.kota_kabupaten,
			provinsi: data.provinsi,
			agama: data.agama,
			status_perkawinan: data.status_perkawinan,
			pekerjaan: data.pekerjaan,
			kewarganegaraan: data.kewarganegaraan,
			masa_berlaku: data.masa_berlaku,
			final_trust_score: finalScore,
			decision,
			reason,
		});
	} catch (err) {
		res.status(500).json({ error: "Server error", detail: err.message });
	}
});

app.get("/v1/kyc/all", async (req, res) => {
	try {
		const { data, error } = await supabase
			.from("kyc_ktp")
			.select("*")
			.order("nama", { ascending: true });

		if (error) {
			return res.status(500).json({ error, detail: error.message });
		}

		return res.status(200).json({
			total: data.length,
			data,
		});
	} catch (err) {
		return res.status(500).json({ error: "Server error", detail: err.message });
	}
});

app.get("/v1/kyc/verification-results", async (req, res) => {
	try {
		const { search, status } = req.query;

		let query = supabase
			.from("kyc_verification_results")
			.select("*")
			.order("created_at", { ascending: false });

		if (search) {
			query = query.or(`nik.ilike.%${search}%,nama.ilike.%${search}%`);
		}

		if (status && status !== "all") {
			query = query.eq("status", status);
		}

		const { data, error } = await query;

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		const total = data.length;
		const approved = data.filter((d) => d.status === "Auto Approved").length;
		const manual = data.filter((d) => d.status === "Manual Review").length;
		const rejected = data.filter((d) => d.status === "Rejected").length;

		return res.status(200).json({
			summary: {
				total,
				approved,
				manual,
				rejected,
			},
			data,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

app.post("/v1/kyc/extract-ktp", upload.single("file"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "File foto KTP wajib diupload" });
		}

		const base64Image = req.file.buffer.toString("base64");

		const prompt = `
Ekstrak informasi berikut dari foto KTP Indonesia dan kembalikan dalam format JSON valid:

{
  "nik": "",
  "nama": "",
  "tempat_lahir": "",
  "tanggal_lahir": "",
  "jenis_kelamin": "",
  "alamat": "",
  "rt": "",
  "rw": "",
  "kelurahan": "",
  "kecamatan": "",
  "kota_kabupaten": "",
  "provinsi": "",
  "agama": "",
  "status_perkawinan": "",
  "pekerjaan": "",
  "kewarganegaraan": "",
  "masa_berlaku": ""
}

Jika tidak yakin, isi null.
Jawaban HARUS hanya JSON tanpa teks tambahan.
`;

		const response = await fetch(
			`https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
				},
				body: JSON.stringify({
					model: "qwen-vl-plus",
					messages: [
						{
							role: "user",
							content: [
								{ type: "text", text: prompt },
								{
									type: "image_url",
									image_url: {
										url: `data:image/jpeg;base64,${base64Image}`,
									},
								},
							],
						},
					],
					temperature: 0,
				}),
			},
		);
		console.log("🚀 ~ response:", response);

		const result = await response.json();

		if (!result.choices) {
			return res.status(500).json({ error: "LLM error", detail: result });
		}

		let extracted;

		try {
			const rawContent = result.choices[0].message.content;

			// Hilangkan markdown code block jika ada
			const cleaned = rawContent
				.replace(/```json/gi, "")
				.replace(/```/g, "")
				.trim();

			// Ambil hanya bagian JSON jika ada teks tambahan
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

			if (!jsonMatch) {
				throw new Error("No valid JSON found");
			}

			extracted = JSON.parse(jsonMatch[0]);
		} catch (err) {
			return res.status(500).json({
				error: "Gagal parse JSON dari LLM",
				raw: result.choices?.[0]?.message?.content,
			});
		}

		return res.status(200).json({
			message: "Ekstraksi berhasil",
			data: extracted,
		});
	} catch (err) {
		return res.status(500).json({
			error: "Server error",
			detail: err.message,
		});
	}
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server jalan di http://localhost:${PORT}`);
});

export default app;
