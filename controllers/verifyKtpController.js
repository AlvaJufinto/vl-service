/** @format */

import { calculateDistance } from "../utils/distance.js";
import { geocodeWithFallback } from "../utils/geocode.js";
import { formatDateToPostgres } from "../utils/helper.js";
import {
	calculateLivenessScore,
	compareFaces,
	extractKtpData,
	getIdentityComplianceScore,
} from "../utils/liveness.js";
import supabase from "../utils/supabase.js";

export async function verifyKtpController(req, res) {
	try {
		const { lat, lng } = req.body;
		if (!req.files?.file_ktp || !req.files?.file_selfie)
			return res
				.status(400)
				.json({ error: "Foto KTP dan selfie wajib diupload" });
		if (!lat || !lng)
			return res.status(400).json({ error: "lat dan lng wajib diisi" });

		const ktpBase64 = req.files.file_ktp[0].buffer.toString("base64");
		const selfieBase64 = req.files.file_selfie[0].buffer.toString("base64");

		// ==== FACE COMPARISON ====
		const faceResult = await compareFaces(ktpBase64, selfieBase64);
		const livenessScore = calculateLivenessScore(faceResult.similarity);
		let reason = [faceResult.reason || "Face compared"];

		// ==== OCR KTP ====
		const ktpData = await extractKtpData(ktpBase64);

		// ==== IDENTITY & COMPLIANCE SCORE ====
		let serperResult = null;
		let identityComplianceResult = null;

		if (ktpData?.nama) {
			const scores = await getIdentityComplianceScore(
				ktpData.nama,
				process.env.SERPER_API_KEY,
			);
			serperResult = scores.serperResult;
			identityComplianceResult = scores.identityComplianceResult;
		}

		// ==== GEOCODING ====
		const geoResult = await geocodeWithFallback(ktpData);
		const ktpLat = geoResult.lat;
		const ktpLng = geoResult.lng;
		reason.push(`Geocode menggunakan: ${geoResult.used_address}`);

		const distance = calculateDistance(
			parseFloat(lat),
			parseFloat(lng),
			ktpLat,
			ktpLng,
		);
		const maxDistance = 10;
		const identityScoreDistance = Math.max(
			20,
			100 - (distance / maxDistance) * 80,
		);

		let identityScore;
		if (
			identityComplianceResult &&
			typeof identityComplianceResult.identity_score === "number"
		) {
			const identityScoreLLM = identityComplianceResult.identity_score;
			identityScore = Math.round(
				identityScoreLLM * 0.7 + identityScoreDistance * 0.3,
			);
			reason.push(
				`Identity score mix: LLM(${identityScoreLLM}) 70% + Distance(${identityScoreDistance.toFixed(
					2,
				)}) 30% = ${identityScore}`,
			);
		} else {
			identityScore = identityScoreDistance;
			reason.push(`Identity score fallback dari distance: ${identityScore}`);
		}

		let complianceScore = 100;
		if (
			identityComplianceResult &&
			typeof identityComplianceResult.compliance_score === "number"
		) {
			complianceScore = identityComplianceResult.compliance_score;
			reason.push("Compliance score dari Google: " + complianceScore);
		}
		if (identityComplianceResult?.alasan)
			reason.push("Alasan: " + identityComplianceResult.alasan);

		const riskScore = 100 - Math.abs(identityScore - livenessScore) / 2;
		const finalScore =
			livenessScore * 0.4 +
			identityScore * 0.3 +
			riskScore * 0.2 +
			complianceScore * 0.1;

		let decision;
		if (finalScore >= 90) decision = "Auto Approved";
		else if (finalScore >= 60) decision = "Manual Review";
		else decision = "Auto Rejected";

		const result = {
			ktp_data: ktpData,
			liveness_score: livenessScore,
			identity_score: identityScore,
			risk_score: Math.round(riskScore),
			compliance_score: complianceScore,
			final_score: Math.round(finalScore),
			decision,
			reason,
			serper_result: serperResult,
			identity_compliance_result: identityComplianceResult,
		};

		// ==== INSERT KE SUPABASE ====
		const { error: supabaseError } = await supabase
			.from("kyc_verification_results")
			.insert([
				{
					nik: ktpData.nik,
					nama: ktpData.nama,
					tempat_lahir: ktpData.tempat_lahir || null,
					tanggal_lahir: formatDateToPostgres(ktpData.tanggal_lahir) || null,
					jenis_kelamin: ktpData.jenis_kelamin || null,
					alamat: ktpData.alamat,
					rt: ktpData.rt || null,
					rw: ktpData.rw || null,
					kelurahan: ktpData.kelurahan,
					kecamatan: ktpData.kecamatan,
					kota_kabupaten: ktpData.kota,
					provinsi: ktpData.provinsi,
					agama: ktpData.agama || null,
					status_perkawinan: ktpData.status_perkawinan || null,
					pekerjaan: ktpData.pekerjaan || null,
					kewarganegaraan: ktpData.kewarganegaraan || "WNI",
					masa_berlaku: ktpData.masa_berlaku || null,
					liveness_score: livenessScore,
					identity_score: identityScore,
					risk_score: Math.round(riskScore),
					compliance_score: complianceScore,
					final_score: Math.round(finalScore),
					status: decision,
					reason: reason,
					serper_result: serperResult,
					identity_compliance_result: identityComplianceResult,
				},
			]);

		if (supabaseError) console.error("Supabase insert error:", supabaseError);

		return res.json(result);
	} catch (err) {
		return res.status(500).json({ error: "Server error", detail: err.message });
	}
}
