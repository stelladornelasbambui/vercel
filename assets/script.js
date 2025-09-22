// Estado da aplicação
let state = {
  selectedImage: null,
  isSending: false
};

// Elementos DOM
const elements = {
  textEditor: document.getElementById("textEditor"),
  charCount: document.getElementById("charCount"),
  sendBtn: document.getElementById("sendBtn"),
  toastContainer: document.getElementById("toastContainer"),

  imageInput: document.getElementById("imageInput"),
  imageUploadBtn: document.getElementById("imageUploadBtn"),
  imagePreview: document.getElementById("imagePreview"),
  previewImg: document.getElementById("previewImg"),
  imageName: document.getElementById("imageName"),
  imageSize: document.getElementById("imageSize"),
  removeImageBtn: document.getElementById("removeImageBtn")
};

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  elements.textEditor.addEventListener("input", updateCharCount);
  elements.sendBtn.addEventListener("click", sendWebhook);

  elements.imageUploadBtn.addEventListener("click", () => elements.imageInput.click());
  elements.imageInput.addEventListener("change", handleImageSelect);
  elements.removeImageBtn.addEventListener("click", removeImage);

  updateCharCount();
});

// Atualiza contador de caracteres
function updateCharCount() {
  const count = elements.textEditor.textContent.length;
  elements.charCount.textContent = count;
  elements.sendBtn.disabled = count === 0 || count > 2000;
}

// Seleção de imagem
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Erro", "Apenas imagens são permitidas", "error");
    return;
  }

  state.selectedImage = file;

  const reader = new FileReader();
  reader.onload = (ev) => {
    elements.previewImg.src = ev.target.result;
    elements.imageName.textContent = file.name;
    elements.imageSize.textContent = formatFileSize(file.size);
    elements.imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  state.selectedImage = null;
  elements.imageInput.value = "";
  elements.imagePreview.style.display = "none";
}

// Converte arquivo em base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // já inclui data:image/png;base64
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Envio da mensagem
async function sendWebhook() {
  if (state.isSending) return;

  const message = elements.textEditor.textContent.trim();
  if (!message) {
    showToast("Aviso aos", "Digite uma mensagem antes de enviar", "warning");
    return;
  }

  state.isSending = true;
  elements.sendBtn.classList.add("loading");
  elements.sendBtn.disabled = true;

  let imageData = null;
  if (state.selectedImage) {
    imageData = await fileToBase64(state.selectedImage);
  }

  const payload = {
    phone: "553799999999", // número destino
    caption: message,
    image: imageData
  };

  try {
    const response = await fetch("/api/send-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();

    showToast("Sucesso", "Mensagem enviada com sucesso!", "success");
    console.log("Resposta:", data);
  } catch (err) {
    console.error("Erro:", err);
    showToast("Erro", "Falha ao enviar mensagem", "error");
  } finally {
    state.isSending = false;
    elements.sendBtn.classList.remove("loading");
    elements.sendBtn.disabled = false;
  }
}

// Toast
function showToast(title, message, type) {
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || "ℹ️"}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
