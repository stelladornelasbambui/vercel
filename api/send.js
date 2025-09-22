export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Aqui você pode inspecionar o payload recebido do frontend
    console.log("📩 Payload recebido no proxy:", req.body);

    // Faz o forward para o endpoint real (Z-API ou seu webhook)
    const response = await fetch("https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    // Tenta ler a resposta (pode ser JSON ou texto)
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    // Devolve para o frontend
    return res.status(response.status).json({
      success: response.ok,
      data,
    });
  } catch (err) {
    console.error("❌ Erro no proxy:", err);
    return res.status(500).json({ error: "Erro no proxy", details: err.message });
  }
}
