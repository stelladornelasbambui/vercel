async function sendWebhook() {
  if (state.isSending) return;

  const message = elements.textEditor.textContent.trim();
  if (!message) {
    showToast("Digite uma mensagem", "warning");
    return;
  }

  state.isSending = true;
  elements.sendBtn.classList.add("loading");
  elements.sendBtn.disabled = true;

  try {
    let imageUrl = null;

    // Se tiver imagem, hospeda no Imgbb
    if (state.selectedImage) {
      imageUrl = await uploadToPostimages(state.selectedImage);
      state.publicImageUrl = imageUrl;
      elements.publicUrl.textContent = imageUrl;
    }

    let endpoint;
    let payload;

    if (imageUrl) {
      endpoint = "/send-image";
      payload = {
        phone: "553799999999",   // Número destino
        image: imageUrl,        // URL pública gerada
        caption: message        // Legenda
      };
    } else {
      endpoint = "/send-text";
      payload = {
        phone: "553799999999",
        text: message           // 👈 precisa ser text
      };
    }

    const response = await fetch(
      `${CONFIG.zapiBase}/token/${CONFIG.zapiToken}${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error("Erro HTTP: " + response.status);

    const result = await response.json();
    console.log("✅ Resultado Z-API:", result);
    showToast("Mensagem enviada com sucesso!", "success");

  } catch (err) {
    console.error("❌ Erro:", err);
    showToast("Erro: " + err.message, "error");
  } finally {
    state.isSending = false;
    elements.sendBtn.classList.remove("loading");
    elements.sendBtn.disabled = false;
  }
}
