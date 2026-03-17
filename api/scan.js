export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { base64, mediaType } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: `You are the world's best trading card identification expert. ALWAYS commit to a specific answer. Read PSA/BGS label text first as it has all key info. Respond ONLY in JSON with no extra text:
{"name":"card name","player":"full name","year":"4 digit year","set":"set name","cardNumber":"number or null","brand":"Panini|Topps|Upper Deck|Pokemon Company","parallel":"Base|Prizm|Holo|Pink Camo|Refractor|Silver|Gold|Rainbow|Chrome","category":"pokemon|sports|magic|yugioh|other","sport":"basketball|football|baseball|soccer|null","condition":"M|NM|LP|MP|HP","estimatedValue":"$XX-XX","confidence":"high|medium|low","notes":"key detail under 15 words"}`,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: "Identify this trading card. Read the label text first — PSA/BGS labels have all details. Return HIGH confidence if you can read player name or set name." }
          ]
        }]
      })
    });
    const data = await response.json();
    res.status(200).json({ result: data.content?.[0]?.text || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
