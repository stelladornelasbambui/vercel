// ================== CONFIG ==================
const CONFIG = {
  maxChars: 2000,

  // 🔑 Z-API
  zapiBase: "https://api.z-api.io/instances/3DF2EE19A630504B2B138E66062CEC0C1",
  zapiToken: "98D3BDE53E512EA3B08B8D07"
};

// ================== ELEMENTOS ==================
const elements = {
  textEditor: document.getElementById("textEditor"),
  charCount: document.getElementById("charCount"),
  clearBtn: document.getElementById("clearBtn"),
  sendBtn: document.getElementById("sendBtn"),
  toastContainer: document.getElementById("toastContainer")
};

// ================== ESTADO ==================
let state = {
  isSending: false
};

// ================== EVENTOS ==================
document.addEventListener("DOMContentLoaded", () => {
  elements.textEditor.addEventListener("input", updateCharCount);
  elements.clearBtn.addEventListener("click", clearEditor);
  elements.sendBtn.addEventListener("click", sendWebhook);
  updateCharCount();
});

// ================== FUNÇÕES ==================
function updateCharCount() {
  const content = elements.textEditor.textContent || "";
  const count = content.length;
  elements.charCount.textContent = count;
  elements.sendBtn.disabled = count === 0 || count > CONFIG.maxChars;
}

function clearEditor() {
  elements.textEditor.innerHTML = "";
  updateCharCount();
  showToast("Editor limpo", "success");
}

// Enviar só texto pela Z-API
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
    const payload = {
      phone: "553799999999", // altere para o número real
      message: message
    };

    const url = `${CONFIG.zapiBase}/token/${CONFIG.zapiToken}/send-text`;
    console.log("📤 URL:", url, "Payload:", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Erro HTTP: " + response.status);

    const result = await response.json();
    showToast("Mensagem de texto enviada com sucesso!", "success");
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

// Toast
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type]} ${message}`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
