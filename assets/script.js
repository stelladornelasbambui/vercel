// Configurações globais
let CONFIG = {
  maxChars: 2000,
  sheetId: '1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899',

  // ⚠️ Coloque aqui seus dados da instância Z-API
  zapiInstance: "3DF2EE19A630504B2B138E66062CE0C1", 
  zapiToken: "9BD3BD5E35E12EA3B0B88D07"
};

// Elementos DOM
const elements = {
  textEditor: document.getElementById('textEditor'),
  charCount: document.getElementById('charCount'),
  sendBtn: document.getElementById('sendBtn'),
  toastContainer: document.getElementById('toastContainer'),

  // Upload de imagem
  imageInput: document.getElementById('imageInput'),
  imageUploadBtn: document.getElementById('imageUploadBtn'),
  imagePreview: document.getElementById('imagePreview'),
  previewImg: document.getElementById('previewImg'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  imageName: document.getElementById('imageName'),
  imageSize: document.getElementById('imageSize')
};

// Estado da aplicação
let state = {
  selectedImage: null,
  isSending: false
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  updateCharCount();
});

// Event Listeners
function initializeEventListeners() {
  // Upload de imagem
  elements.imageUploadBtn.addEventListener('click', () => elements.imageInput.click());
  elements.imageInput.addEventListener('change', handleImageSelect);
  elements.removeImageBtn.addEventListener('click', removeImage);

  // Editor
  elements.textEditor.addEventListener('input', updateCharCount);

  // Botão enviar
  elements.sendBtn.addEventListener('click', sendWebhook);
}

// Seleção de imagem
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showToast('Erro', 'Apenas arquivos de imagem são permitidos', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Erro', 'A imagem deve ter no máximo 5MB', 'error');
      return;
    }

    state.selectedImage = file;

    const reader = new FileReader();
    reader.onload = function(ev) {
      elements.previewImg.src = ev.target.result;
      elements.imageName.textContent = file.name;
      elements.imageSize.textContent = formatFileSize(file.size);
      elements.imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    showToast('Sucesso', 'Imagem selecionada com sucesso', 'success');
  }
}

function removeImage() {
  state.selectedImage = null;
  elements.imageInput.value = '';
  elements.imagePreview.style.display = 'none';
  showToast('Sucesso', 'Imagem removida', 'success');
}

// Atualizar contador
function updateCharCount() {
  const content = elements.textEditor.textContent || '';
  const count = content.length;

  elements.charCount.textContent = count;
  elements.sendBtn.disabled = count === 0 || count > CONFIG.maxChars;
}

// Envio via Z-API
async function sendWebhook() {
  if (state.isSending) return;

  const message = elements.textEditor.textContent.trim();
  if (!message) {
    showToast('Aviso', 'Digite uma mensagem antes de enviar', 'warning');
    return;
  }

  state.isSending = true;
  elements.sendBtn.classList.add('loading');
  elements.sendBtn.disabled = true;

  let imageData = null;
  if (state.selectedImage) {
    imageData = await fileToBase64(state.selectedImage); // já vem com prefixo data:image/png;base64
  }

  const payload = {
    phone: "553799999999",  // ⚠️ Aqui pode ser dinâmico (ex: puxar da planilha)
    caption: message,
    image: imageData || "https://i.postimg.cc/GhXf2kdJ/logo.png" // fallback
  };

  try {
    const url = `https://api.z-api.io/instances/${CONFIG.zapiInstance}/token/${CONFIG.zapiToken}/send-image`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();
    console.log("Resposta Z-API:", data);
    showToast('Sucesso', 'Mensagem enviada com imagem!', 'success');
  } catch (error) {
    console.error("Erro ao enviar:", error);
    showToast('Erro', 'Erro de conexão ao enviar webhook', 'error');
  } finally {
    state.isSending = false;
    elements.sendBtn.classList.remove('loading');
    elements.sendBtn.disabled = false;
  }
}

// Helpers
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showToast(title, message, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
