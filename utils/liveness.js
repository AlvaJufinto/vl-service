/** @format */

import { callQwenAPI } from "./api.js";

export async function extractKtpData(ktpBase64) {
	const prompt = `Ekstrak data berikut dari foto KTP ke dalam format JSON valid:
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
  Hanya kembalikan JSON, tanpa teks penjelasan.`;

	try {
		const data = await callQwenAPI(prompt, [ktpBase64]);

		if (!data?.choices?.[0]?.message?.content) {
			throw new Error("OCR API error: Unexpected response structure");
		}

		const content = data.choices[0].message.content;
		const ktpData = parseJSONResponse(content);

		if (!ktpData) {
			throw new Error("OCR JSON parse error: Failed to extract valid object");
		}

		return ktpData;
	} catch (error) {
		console.error("Extraction failed:", error.message);
		throw error;
	}
}

export function calculateLivenessScore(similarity) {
	if (similarity >= 0.85) return 100;
	if (similarity >= 0.75) return 80;
	if (similarity >= 0.65) return 60;
	return 0;
}

export function parseJSONResponse(rawContent) {
	try {
		const clean = rawContent
			.replace(/```json/gi, "")
			.replace(/```/g, "")
			.trim();
		return JSON.parse(clean.match(/\{[\s\S]*\}/)[0]);
	} catch {
		return null;
	}
}

export async function compareFaces(ktpBase64, selfieBase64) {
	const prompt = `
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
	const data = await callQwenAPI(prompt, [ktpBase64, selfieBase64]);
	if (!data.choices) throw new Error("Face API error");

	const result = parseJSONResponse(data.choices[0].message.content);
	if (!result) throw new Error("Face JSON parse error");

	return {
		similarity: parseFloat(result.similarity) || 0,
		reason: result.reason,
	};
}

export async function getIdentityComplianceScore(name, serperApiKey) {
	let serperResult = null;
	let identityComplianceResult = null;

	try {
		const serperRes = await fetch("https://google.serper.dev/search", {
			method: "POST",
			headers: {
				"X-API-KEY": serperApiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ q: name, gl: "id", hl: "id" }),
		});
		serperResult = await serperRes.json();

		if (serperResult) {
			const prompt = `
Berdasarkan hasil pencarian Google berikut (dalam format JSON), berikan penilaian identity_score (0-100) dan compliance_score (0-100) untuk nama: ${name}. Jawab hanya JSON dengan format:
{"identity_score": 0-100, "compliance_score": 0-100, "alasan": "..."}
Data Google:
${JSON.stringify(serperResult).slice(0, 4000)}
`;
			const qwenData = await callQwenAPI(prompt);
			identityComplianceResult = parseJSONResponse(
				qwenData.choices[0].message.content,
			);
		}
	} catch {
		serperResult = null;
		identityComplianceResult = null;
	}

	return { serperResult, identityComplianceResult };
}
