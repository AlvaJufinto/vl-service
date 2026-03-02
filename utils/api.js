/** @format */

export async function callQwenAPI(prompt, images = []) {
	const bodyContent = images.length
		? [
				{ type: "text", text: prompt },
				...images.map((img) => ({
					type: "image_url",
					image_url: { url: `data:image/jpeg;base64,${img}` },
				})),
			]
		: [{ type: "text", text: prompt }];

	const res = await fetch(
		"https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
			},
			body: JSON.stringify({
				model: "qwen-vl-plus",
				messages: [{ role: "user", content: bodyContent }],
				temperature: 0,
			}),
		},
	);
	return res.json();
}
