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

    // Se tiver imagem, primeiro sobe para Imgbb
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
        phone: "553799999999",
        image: imageUrl,
        caption: message
      };
    } else {
      endpoint = "/send-text";
      payload = {
        phone: "553799999999",
        text: message   // 👈 aqui muda para text
      };
    }

    const response = await fetch(`${CONFIG.zapiBase}/token/${CONFIG.zapiToken}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Erro HTTP: " + response.status);

    const result = await response.json();
    showToast("Mensagem enviada com sucesso!", "success");
    console.log("✅ Resultado Z-API:", result);

  } catch (err) {
    console.error("❌ Erro:", err);
    showToast("Erro: " + err.message, "error");
  } finally {
    state.isSending = false;
    elements.sendBtn.classList.remove("loading");
    elements.sendBtn.disabled = false;
  }
}
