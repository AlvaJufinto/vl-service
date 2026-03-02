/** @format */

export function formatDateToPostgres(dateStr) {
	// input: "DD-MM-YYYY"
	if (!dateStr) return null;
	const parts = dateStr.split("-");
	if (parts.length !== 3) return null;
	const [day, month, year] = parts;
	return `${year}-${month}-${day}`; // YYYY-MM-DD
}
