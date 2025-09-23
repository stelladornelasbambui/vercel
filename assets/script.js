// ================== ENVIO VIA WEBHOOK ==================
async function sendWebhook() {
    if (state.isSending) return;

    const message = elements.textEditor.innerText.trim(); // ✅ corrigido
    if (!message) {
        showToast('Aviso', 'Digite uma mensagem antes de enviar', 'warning');
        return;
    }

    state.isSending = true;
    elements.sendBtn.disabled = true;

    const apiUrl = "https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12";

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                timestamp: Date.now()
            })
        });

        const text = await response.text();
        console.log("Resposta do Webhook:", text);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} - ${text}`);
        }

        showToast('Sucesso', 'Mensagem enviada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao acionar webhook:', error);
        showToast('Erro', 'Falha ao acionar webhook', 'error');
    } finally {
        state.isSending = false;
        elements.sendBtn.disabled = false;
    }
}
