// ================== CONFIG ===================
let CONFIG = {
    maxChars: 2000,
    sheetId: '1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899'
};

async function loadConfig() {
    try {
        const response = await fetch('config/config.json');
        const configData = await response.json();
        CONFIG.maxChars = configData.editor.maxChars;
        CONFIG.sheetId = configData.googleSheets.sheetId;
        CONFIG.sheetUrl = configData.googleSheets.sheetUrl;
        console.log('Configurações carregadas:', CONFIG);
    } catch (error) {
        console.warn('Erro ao carregar configurações, usando padrões:', error);
    }
}

// ================== ELEMENTOS ==================
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFile: document.getElementById('removeFile'),
    uploadBtn: document.getElementById('uploadBtn'),
    textEditor: document.getElementById('textEditor'),
    charCount: document.getElementById('charCount'),
    clearBtn: document.getElementById('clearBtn'),
    sendBtn: document.getElementById('sendBtn'),
    toastContainer: document.getElementById('toastContainer'),
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg')
};

// ================== ESTADO ==================
let state = {
    selectedFile: null,
    isSending: false,
    imageUrl: null
};

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    initializeEventListeners();
    updateCharCount();
});

function initializeEventListeners() {
    // Planilha
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.removeFile.addEventListener('click', removeFile);
    elements.uploadBtn.addEventListener('click', uploadFile);

    // Editor
    elements.textEditor.addEventListener('input', updateCharCount);
    elements.textEditor.addEventListener('paste', handlePaste);
    elements.clearBtn.addEventListener('click', clearEditor);
    elements.sendBtn.addEventListener('click', sendWebhook);

    // Imagem
    elements.imageInput.addEventListener('change', handleImageUpload);
}

// ================== UPLOAD PLANILHA ==================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        showToast('Erro', 'Apenas arquivos .xlsx são permitidos', 'error');
        return;
    }
    state.selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.style.display = 'flex';
    elements.uploadArea.style.display = 'none';
    elements.uploadBtn.disabled = false;
}

function removeFile() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.fileInfo.style.display = 'none';
    elements.uploadArea.style.display = 'block';
    elements.uploadBtn.disabled = false;
}

function uploadFile() {
    window.open(CONFIG.sheetUrl, '_blank');
    showToast('Sucesso', 'Abrindo planilha do Google Sheets...', 'success');
}

// ================== UPLOAD IMAGEM (ImgBB) ==================
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onload = () => {
        elements.previewImg.src = reader.result;
        elements.imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);

    // Envio para ImgBB
    const formData = new FormData();
    formData.append("image", file);

    try {
        const imgbbKey = "d596c56f618c3db7601359e81c868ec5"; // sua API key
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            state.imageUrl = result.data.url; // URL pública
            showToast('Sucesso', 'Imagem enviada para ImgBB!', 'success');
        } else {
            throw new Error(result.error?.message || "Falha no upload");
        }
    } catch (err) {
        console.error(err);
        showToast('Erro', 'Erro ao enviar imagem para ImgBB', 'error');
    }
}

// ================== EDITOR ==================
function updateCharCount() {
    const content = elements.textEditor.textContent || '';
    const count = content.length;
    elements.charCount.textContent = count;
    elements.charCount.className = 'char-counter';
    if (count > CONFIG.maxChars * 0.9) elements.charCount.classList.add('warning');
    if (count > CONFIG.maxChars) elements.charCount.classList.add('error');
    elements.sendBtn.disabled = count === 0 || count > CONFIG.maxChars;
}

function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
}

function clearEditor() {
    elements.textEditor.innerHTML = '';
    updateCharCount();
    showToast('Sucesso', 'Editor limpo com sucesso', 'success');
}

// ================== WEBHOOK (Z-API) ==================
async function sendWebhook() {
    if (state.isSending) return;

    const message = elements.textEditor.textContent.trim();
    if (!message && !state.imageUrl) {
        showToast('Aviso', 'Digite uma mensagem ou envie uma imagem antes de enviar', 'warning');
        return;
    }

    state.isSending = true;
    elements.sendBtn.classList.add('loading');
    elements.sendBtn.disabled = true;

    // 🔹 Monta payload no formato da Z-API
    let payload = {
        phone: "5533999999999" // depois você vai dinamizar pelos contatos da planilha
    };

    if (state.imageUrl) {
        payload.image = state.imageUrl; // URL pública do ImgBB
        payload.caption = message || ""; // legenda opcional
    } else {
        payload.message = message; // texto puro
    }

    try {
const response = await fetch("https://api.z-api.io/instances/3DF2EE19A630504B2B138E66062CE0C1/token/9BD3BD5E35E12EA3B0B88D07/send-messages", {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();

        console.log("Resposta da Z-API:", result);

if (response.ok && !result.error) {
    showToast('Sucesso', 'Mensagem enviada com sucesso via Z-API!', 'success');
} else {
    showToast('Erro', result.error || JSON.stringify(result), 'error');
}

    } catch (error) {
        console.error('Erro ao enviar webhook:', error);
        showToast('Erro', 'Erro de conexão ao enviar via Z-API', 'error');
    } finally {
        state.isSending = false;
        elements.sendBtn.classList.remove('loading');
        elements.sendBtn.disabled = false;
    }
}

// ================== HELPERS ==================
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
