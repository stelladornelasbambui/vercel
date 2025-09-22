// Configurações globais
let CONFIG = {
  maxChars: 2000,
  sheetId: "1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s",
  sheetUrl: "https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899"
};

// Elementos DOM
const elements = {
  uploadArea: document.getElementById("uploadArea"),
  fileInput: document.getElementById("fileInput"),
  fileInfo: document.getElementById("fileInfo"),
  fileName: document.getElementById("fileName"),
  fileSize: document.getElementById("fileSize"),
  removeFile: document.getElementById("removeFile"),
  uploadBtn: document.getElementById("uploadBtn"),
  textEditor: document.getElementById("textEditor"),
  charCount: document.getElementById("charCount"),
  clearBtn: document.getElementById("clearBtn"),
  sendBtn: document.getElementById("sendBtn"),
  toastContainer: document.getElementById("toastContainer"),
  imageInput: document.getElementById("imageInput"),
  imageUploadBtn: document.getElementById("imageUploadBtn"),
  previewImg: document.getElementById("previewImg"),
  imagePreview: document.getElementById("imagePreview"),
  removeImageBtn: document.getElementById("removeImageBtn"),
  imageName: document.getElementById("imageName"),
  imageSize: document.getElementById("imageSize")
};

// Estado da aplicação
let state = {
  selectedFile: null,
  selectedImage: null,
  isSending: false
};

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  updateCharCount();
});

// Event Listeners
function initializeEventListeners() {
  // Upload de planilha
  elements.uploadArea.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", handleFileSelect);
  elements.removeFile.addEventListener("click", removeFile);
  elements.uploadBtn.addEventListener("click", uploadFile);

  // Editor
  elements.textEditor.addEventListener("input", updateCharCount);
  elements.clearBtn.addEventListener("click", clearEditor);
  elements.sendBtn.addEventListener("click", sendWebhook);

  // Imagem
  elements.imageUploadBtn.addEventListener("click", () => elements.imageInput.click());
  elements.imageInput.addEventListener("change", handleImageSelect);
  elements.removeImageBtn.addEventListener("click", removeImage);
}

// Upload de planilha
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.name.toLowerCase().endsWith(".xlsx")) {
    state.selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.style.display = "flex";
    elements.uploadArea.style.display = "none";
  } else {
    showToast("Erro", "Apenas arquivos .xlsx são permitidos", "error");
  }
}

function removeFile() {
  state.selectedFile = null;
  elements.fileInput.value = "";
  elements.fileInfo.style.display = "none";
  elements.uploadArea.style.display = "block";
}

function uploadFile() {
  window.open(CONFIG.sheetUrl, "_blank");
}

// Upload de imagem
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Erro", "Apenas imagens são permitidas", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Erro", "Imagem deve ter no máximo 5MB", "error");
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

  showToast("Sucesso", "Imagem selecionada!", "success");
}

function removeImage() {
  state.selectedImage = null;
  elements.imageInput.value = "";
  elements.imagePreview.style.display = "none";
}

// Funções utilitárias
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function updateCharCount() {
  const count = elements.textEditor.textContent.length;
  elements.charCount.textContent = count;
  elements.sendBtn.disabled = count === 0 || count > CONFIG.maxChars;
}

function clearEditor() {
  elements.textEditor.innerHTML = "";
  updateCharCount();
  if (state.selectedImage) removeImage();
}

// Converter para base64
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve({ data: base64String });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Enviar webhook
async function sendWebhook() {
  if (state.isSending) return;

  const message = elements.textEditor.textContent.trim();
  if (!message) {
    showToast("Aviso", "Digite uma mensagem antes de enviar", "warning");
    return;
  }

  state.isSending = true;
  elements.sendBtn.disabled = true;

  let imageUrl = null;
  if (state.selectedImage) {
    try {
      const base64Data = await convertImageToBase64(state.selectedImage);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data.data })
      });

      const uploadJson = await uploadRes.json();
      if (uploadJson.success) {
        imageUrl = uploadJson.url;
      }
    } catch (err) {
      console.error("Erro upload:", err);
      showToast("Erro", "Falha no upload da imagem", "error");
    }
  }

  const payload = {
    phone: "553799999999",
    message: message,
    image: imageUrl, // URL pública (Postimages)
    caption: message
  };

  try {
    const response = await fetch("https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN/send-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    showToast("Sucesso", "Mensagem enviada!", "success");
    console.log("Resposta Z-API:", data);
  } catch (error) {
    console.error("Erro ao enviar:", error);
    showToast("Erro", "Erro ao enviar mensagem", "error");
  } finally {
    state.isSending = false;
    elements.sendBtn.disabled = false;
  }
}

// Toast
function showToast(title, message, type = "success") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), type === "success" ? 3000 : 5000);
}
