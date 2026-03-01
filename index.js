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

function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // km
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

async function geocodeWithFallback(ktpData) {
	const normalize = (str) =>
		str
			? str
					.replace(/PROVINSI\s+/i, "")
					.replace(/JAKARTA TIMUR/i, "East Jakarta")
					.replace(/JAKARTA BARAT/i, "West Jakarta")
					.replace(/JAKARTA SELATAN/i, "South Jakarta")
					.replace(/JAKARTA UTARA/i, "North Jakarta")
					.replace(/JAKARTA PUSAT/i, "Central Jakarta")
					.trim()
			: "";

	const street = normalize(ktpData.alamat);
	const suburb = normalize(ktpData.kelurahan);
	const city = normalize(ktpData.kota || ktpData.kota_kabupaten);
	const state = normalize(ktpData.provinsi);
	const country = "Indonesia";

	// Hierarki fallback:
	const queries = [
		{ street, suburb, city, state, country }, // full structured → paling presisi
		{ street, city, state, country },
		{ city, state, country }, // kota + provinsi
		{ state, country }, // provinsi
		{ country }, // country only
	];

	for (let q of queries) {
		const params = new URLSearchParams({
			format: "json",
			addressdetails: "1",
			limit: "1",
			...Object.fromEntries(
				Object.entries(q).filter(([k, v]) => v && v.length > 0),
			),
		});

		const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
		console.log("🚀 ~ geocodeWithFallback ~ url:", url);

		try {
			const res = await fetch(url, {
				headers: { "User-Agent": "kyc-demo-app" },
			});
			const data = await res.json();

			if (data && data.length > 0) {
				return {
					lat: parseFloat(data[0].lat),
					lng: parseFloat(data[0].lon),
					used_address: Object.values(q).filter(Boolean).join(", "),
				};
			}
		} catch (err) {
			console.warn("Nominatim fetch error:", err.message);
		}
	}

	return null;
}

app.post(
	"/v1/kyc/verify-ktp",
	upload.fields([
		{ name: "file_ktp", maxCount: 1 },
		{ name: "file_selfie", maxCount: 1 },
	]),
	async (req, res) => {
		try {
			const { lat, lng } = req.body;

			if (!req.files?.file_ktp || !req.files?.file_selfie) {
				return res
					.status(400)
					.json({ error: "Foto KTP dan selfie wajib diupload" });
			}

			if (!lat || !lng) {
				return res.status(400).json({ error: "lat dan lng wajib diisi" });
			}

			let livenessScore = 0;
			let identityScore = 0;
			let riskScore = 0;
			let complianceScore = 100;
			let reason = [];

			const ktpBase64 = req.files.file_ktp[0].buffer.toString("base64");
			const selfieBase64 = req.files.file_selfie[0].buffer.toString("base64");

			// =====================================================
			// 1️⃣ FACE MATCHING (QWEN)
			// =====================================================

			const facePrompt = `
Bandingkan dua foto wajah berikut:
Foto pertama adalah wajah pada KTP.
Foto kedua adalah foto selfie.

Jawab dalam JSON valid:
{
  "same_person": true/false,
  "similarity": 0-1,
  "reason": ""
}

Hanya JSON.
`;

			const faceRes = await fetch(
				"https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
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
									{ type: "text", text: facePrompt },
									{
										type: "image_url",
										image_url: { url: `data:image/jpeg;base64,${ktpBase64}` },
									},
									{
										type: "image_url",
										image_url: {
											url: `data:image/jpeg;base64,${selfieBase64}`,
										},
									},
								],
							},
						],
						temperature: 0,
					}),
				},
			);

			const faceData = await faceRes.json();
			if (!faceData.choices) {
				return res
					.status(500)
					.json({ error: "Face API error", detail: faceData });
			}

			let similarity = 0;
			try {
				const raw = faceData.choices[0].message.content
					.replace(/```json/gi, "")
					.replace(/```/g, "")
					.trim();

				const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);

				similarity = parseFloat(parsed.similarity) || 0;
				reason.push(parsed.reason || "Face compared");
			} catch (err) {
				return res.status(500).json({
					error: "Face JSON parse error",
					raw: faceData.choices[0].message.content,
				});
			}

			if (similarity >= 0.85) livenessScore = 100;
			else if (similarity >= 0.75) livenessScore = 80;
			else if (similarity >= 0.65) livenessScore = 60;
			else livenessScore = 0;

			// =====================================================
			// 2️⃣ OCR KTP (QWEN)
			// =====================================================

			const ocrPrompt = `
Ekstrak data berikut dari foto KTP dalam JSON valid:

{
  "nik": "",
  "nama": "",
  "alamat": "",
  "kelurahan": "",
  "kecamatan": "",
  "kota": "",
  "provinsi": ""
}

Hanya JSON.
`;

			const ocrRes = await fetch(
				"https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
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
									{ type: "text", text: ocrPrompt },
									{
										type: "image_url",
										image_url: { url: `data:image/jpeg;base64,${ktpBase64}` },
									},
								],
							},
						],
						temperature: 0,
					}),
				},
			);

			const ocrData = await ocrRes.json();
			if (!ocrData.choices) {
				return res
					.status(500)
					.json({ error: "OCR API error", detail: ocrData });
			}

			let ktpData;
			try {
				const raw = ocrData.choices[0].message.content
					.replace(/```json/gi, "")
					.replace(/```/g, "")
					.trim();

				ktpData = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
			} catch (err) {
				return res.status(500).json({
					error: "OCR JSON parse error",
					raw: ocrData.choices[0].message.content,
				});
			}

			// =====================================================
			// 3️⃣ GEOCODING (NOMINATIM)
			// =====================================================

			const fullAddress = `
${ktpData.alamat},
${ktpData.kelurahan},
${ktpData.kecamatan},
${ktpData.kota},
${ktpData.provinsi},
Indonesia
`;

			const geoResult = await geocodeWithFallback(ktpData);

			if (!geoResult) {
				return res.status(400).json({
					error: "Alamat tidak ditemukan setelah fallback",
				});
			}

			const ktpLat = geoResult.lat;
			const ktpLng = geoResult.lng;

			reason.push(`Geocode menggunakan: ${geoResult.used_address}`);

			// =====================================================
			// 4️⃣ DISTANCE
			// =====================================================

			const distance = calculateDistance(
				parseFloat(lat),
				parseFloat(lng),
				ktpLat,
				ktpLng,
			);

			const maxDistance = 15;
			identityScore = Math.max(20, 100 - (distance / maxDistance) * 80);
			reason.push(`Distance: ${distance.toFixed(2)} km`);

			// =====================================================
			// 5️⃣ FINAL SCORING
			// =====================================================

			riskScore = 100 - Math.abs(identityScore - livenessScore) / 2;

			const finalScore =
				livenessScore * 0.4 +
				identityScore * 0.3 +
				riskScore * 0.2 +
				complianceScore * 0.1;

			let decision;
			if (finalScore >= 90) decision = "Auto Approved";
			else if (finalScore >= 60) decision = "Manual Review";
			else decision = "Auto Rejected";

			return res.json({
				ktp_data: ktpData,
				liveness_score: livenessScore,
				identity_score: identityScore,
				risk_score: Math.round(riskScore),
				compliance_score: complianceScore,
				final_score: Math.round(finalScore),
				decision,
				reason,
			});
		} catch (err) {
			return res.status(500).json({
				error: "Server error",
				detail: err.message,
			});
		}
	},
);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server jalan di http://localhost:${PORT}`);
});

export default app;
