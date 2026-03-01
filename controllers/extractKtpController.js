/** @format */

import fetch from "node-fetch";

export async function extractKtpController(req, res) {
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

		const result = await response.json();

		if (!result.choices) {
			return res.status(500).json({ error: "LLM error", detail: result });
		}

		let extracted;
		try {
			const rawContent = result.choices[0].message.content;
			const cleaned = rawContent
				.replace(/```json/gi, "")
				.replace(/```/g, "")
				.trim();
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
}
