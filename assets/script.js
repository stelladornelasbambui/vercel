// ===== Util =====
const $ = (id) => document.getElementById(id);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

function showToast(title, message, type = "success") {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || "ℹ️"}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  $("toastContainer").appendChild(toast);
  setTimeout(() => toast.remove(), type === "success" ? 3000 : 5000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ===== Estado =====
let state = {
  selectedFile: null,
  selectedImage: null,
  isSending: false
};

// ===== Inicialização =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("[INIT] DOM pronto");

  // Planilha
  on($("uploadArea"), "click", () => $("fileInput").click());
  on($("fileInput"), "change", handleFileSelect);
  on($("uploadBtn"), "click", uploadFile);
  on($("removeFile"), "click", removeFile);

  // Editor
  on($("textEditor"), "input", updateCharCount);
  on($("clearBtn"), "click", clearEditor);
  on($("sendBtn"), "click", sendWebhook);

  // Imagem
  // 1) Fallback sem JS já funciona via <label for="imageInput">
  // 2) Com JS, também forçamos o click programático (não faz mal ter os dois)
  on($("imageUploadBtn"), "click", (e) => {
    console.log("[IMG] Botão clicado");
    // se por algum CSS o label não abrir, garantimos programaticamente:
    const input = $("imageInput");
    if (input) input.click();
  });

  on($("imageInput"), "change", handleImageSelect);
  on($("removeImageBtn"), "click", removeImage);

  // Habilita o botão se tiver texto
  updateCharCount();
});

// ===== Planilha =====
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
    showToast("Erro", "Apenas arquivos .xlsx ou .xls são permitidos", "error");
    return;
  }
  state.selectedFile = file;
  $("fileName").textContent = file.name;
  $("fileSize").textContent = formatFileSize(file.size);
  $("fileInfo").style.display = "flex";
  $("uploadArea").style.display = "none";
}

function removeFile() {
  state.selectedFile = null;
  $("fileInput").value = "";
  $("fileInfo").style.display = "none";
  $("uploadArea").style.display = "block";
}

function uploadFile() {
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899";
  window.open(sheetUrl, "_blank");
  showToast("Sucesso", "Abrindo planilha do Google Sheets...", "success");
}

// ===== Editor =====
function updateCharCount() {
  const count = ($("textEditor").textContent || "").length;
  $("charCount").textContent = count;
  $("sendBtn").disabled = count === 0 || count > 2000;
}

function clearEditor() {
  $("textEditor").innerHTML = "";
  updateCharCount();
  if (state.selectedImage) removeImage();
  showToast("Sucesso", "Editor limpo com sucesso", "success");
}

// ===== Imagem =====
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
    $("previewImg").src = ev.target.result;
    $("imageName").textContent = file.name;
    $("imageSize").textContent = formatFileSize(file.size);
    $("imagePreview").style.display = "block";
  };
  reader.onerror = (err) => console.error("[IMG] FileReader error:", err);
  reader.readAsDataURL(file);

  console.log("[IMG] Imagem selecionada:", file.name, file.type, file.size);
  showToast("Sucesso", "Imagem selecionada!", "success");
}

function removeImage() {
  state.selectedImage = null;
  $("imageInput").value = "";
  $("imagePreview").style.display = "none";
}

// ===== Envio (exemplo mínimo só para destravar botão) =====
// Substitua este trecho pelo seu fluxo de upload->URL pública->Z-API
async function sendWebhook() {
  if (state.isSending) return;

  const message = ($("textEditor").textContent || "").trim();
  if (!message) {
    showToast("Aviso", "Digite uma mensagem antes de enviar", "warning");
    return;
  }

  state.isSending = true;
  $("sendBtn").disabled = true;

  try {
    // Aqui você pode acionar seu fluxo atual (upload para Postimages/Cloudinary etc)
    console.log("[SEND] Enviando com mensagem:", message);
    if (state.selectedImage) {
      console.log("[SEND] Tem imagem selecionada:", state.selectedImage.name);
    }

    // Simulando sucesso
    showToast("Sucesso", "Mensagem (simulada) enviada!", "success");
  } catch (err) {
    console.error("[SEND] Erro:", err);
    showToast("Erro", "Falha ao enviar", "error");
  } finally {
    state.isSending = false;
    $("sendBtn").disabled = false;
  }
}
