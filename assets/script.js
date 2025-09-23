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

// ================== ELEMENTOS ======f============
// ================== ELEMENTOS ======f============
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
    toastContainer: document.getElementById('toastContainer')
};

// ================== ESTADO ==================
let state = {
    selectedFile: null,
    isSending: false
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

// ================== ENVIO VIA Z-API (texto apenas) ==================
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

    // URL da sua instância Z-API
    const apiUrl = "https://api.z-api.io/instances/3DF2EE19A630504B2B138E66062CE0C1/token/9BD3BD5E35E12EA3B0B88D07/send-text";

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: "5531999999999",  // 👈 coloque o número destino aqui no formato 55 + DDD + número
                message: message
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Resposta da Z-API:", result);

        showToast('Sucesso', 'Mensagem enviada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showToast('Erro', 'Erro ao enviar mensagem via Z-API', 'error');
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
