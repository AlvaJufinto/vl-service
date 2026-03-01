/** @format */

import fetch from "node-fetch";

import { calculateDistance } from "../utils/distance.js";
import { geocodeWithFallback } from "../utils/geocode.js";

export async function verifyKtpController(req, res) {
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

		// 1️⃣ FACE MATCHING (QWEN)
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
									image_url: { url: `data:image/jpeg;base64,${selfieBase64}` },
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

		// 2️⃣ OCR KTP (QWEN)
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
			return res.status(500).json({ error: "OCR API error", detail: ocrData });
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

		// 3️⃣ GEOCODING (NOMINATIM)
		const geoResult = await geocodeWithFallback(ktpData);
		if (!geoResult) {
			return res
				.status(400)
				.json({ error: "Alamat tidak ditemukan setelah fallback" });
		}
		const ktpLat = geoResult.lat;
		const ktpLng = geoResult.lng;
		reason.push(`Geocode menggunakan: ${geoResult.used_address}`);

		// 4️⃣ DISTANCE
		const distance = calculateDistance(
			parseFloat(lat),
			parseFloat(lng),
			ktpLat,
			ktpLng,
		);
		const maxDistance = 15;
		identityScore = Math.max(20, 100 - (distance / maxDistance) * 80);
		reason.push(`Distance: ${distance.toFixed(2)} km`);

		// 5️⃣ FINAL SCORING
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
		return res.status(500).json({ error: "Server error", detail: err.message });
	}
}
