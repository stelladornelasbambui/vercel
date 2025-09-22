// ================== CONFIG ==================
const CONFIG = {
  maxChars: 2000,

  // 🔑 Z-API
  zapiBase: "https://api.z-api.io/instances/3DF2EE19A630504B2B138E66062CEC0C1",
  zapiToken: "98D3BDE53E512EA3B08B8D07",

  // 🔑 Imgbb
  imgbbKey: "babc90a7ab9bddc78a89ebe1108ff464"
};

// ================== ELEMENTOS ==================
const elements = {
  textEditor: document.getElementById("textEditor"),
  charCount: document.getElementById("charCount"),
  clearBtn: document.getElementById("clearBtn"),
  sendBtn: document.getElementById("sendBtn"),
  toastContainer: document.getElementById("toastContainer"),

  imageInput: document.getElementById("imageInput"),
  imageUploadBtn: document.getElementById("imageUploadBtn"),
  imagePreview: document.getElementById("imagePreview"),
  previewImg: document.getElementById("previewImg"),
  removeImageBtn: document.getElementById("removeImageBtn"),
  publicUrl: document.getElementById("publicUrl")
};

// ================== ESTADO ==================
let state = {
  selectedImage: null,
  publicImageUrl: null,
  isSending: false
};

// ================== EVENTOS =====================
document.addEventListener("DOMContentLoaded", () => {
  elements.textEditor.addEventListener("input", updateCharCount);
  elements.clearBtn.addEventListener("click", clearEditor);
  elements.sendBtn.addEventListener("click", sendWebhook);

  elements.imageUploadBtn.addEventListener("click", () => elements.imageInput.click());
  elements.imageInput.addEventListener("change", handleImageSelect);
  elements.removeImageBtn.addEventListener("click", removeImage);

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

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    state.selectedImage = file;
    elements.previewImg.src = URL.createObjectURL(file);
    elements.imagePreview.style.display = "block";
    showToast("Imagem selecionada", "success");
  }
}

function removeImage() {
  state.selectedImage = null;
  state.publicImageUrl = null;
  elements.imageInput.value = "";
  elements.imagePreview.style.display = "none";
  elements.publicUrl.textContent = "";
}

// Upload para Imgbb
async function uploadToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);

  const url = `https://api.imgbb.com/1/upload?key=${CONFIG.imgbbKey}`;
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();

  if (!data.success) throw new Error("Erro ao hospedar imagem");
  return data.data.url; // URL pública
}

// Enviar via Z-API
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
    if (state.selectedImage) {
      imageUrl = await uploadToImgbb(state.selectedImage);
      state.publicImageUrl = imageUrl;
      elements.publicUrl.textContent = imageUrl;
    }

    const payload = {
      phone: "553799999999", // altere para o número real
      message: message
    };

    let endpoint = "/send-text";
    if (imageUrl) {
      payload.image = imageUrl;
      payload.caption = message;
      endpoint = "/send-image";
    }

    const response = await fetch(`${CONFIG.zapiBase}/token/${CONFIG.zapiToken}/${endpoint}`, {
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

// Toast
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type]} ${message}`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
