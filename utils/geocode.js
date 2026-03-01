/** @format */

export async function geocodeWithFallback(ktpData) {
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

	const queries = [
		{ street, suburb, city, state, country },
		{ street, city, state, country },
		{ city, state, country },
		{ state, country },
		{ country },
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
