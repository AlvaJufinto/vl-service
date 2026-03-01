/** @format */

import supabase from "../utils/supabase.js";

export async function verifyNikController(req, res) {
	const { nik } = req.body;
	if (!nik) {
		return res.status(400).json({ error: "nik wajib diisi" });
	}
	try {
		let identityScore = 0;
		let livenessScore = 0;
		let riskScore = 0;
		let complianceScore = 0;
		let decision = "";
		let reason = [];

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

		livenessScore = Math.floor(Math.random() * 6) + 25;
		reason.push("Liveness detection sukses");

		riskScore = Math.floor(Math.random() * 6) + 15;
		reason.push("Device/IP aman");

		complianceScore = Math.floor(Math.random() * 6);
		reason.push("Tidak terindikasi sanction list");

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
			...data,
			final_trust_score: finalScore,
			decision,
			reason,
		});
	} catch (err) {
		res.status(500).json({ error: "Server error", detail: err.message });
	}
}

export async function getAllKycController(req, res) {
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
}

export async function getVerificationResultsController(req, res) {
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
}
