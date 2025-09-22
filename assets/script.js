// Configurações globais - carregadas do config.json
let CONFIG = {
maxChars: 2000,
sheetId: '1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s',
sheetUrl: 'https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899'
};

// Carregar configurações do arquivo config.json
async function loadConfig() {
try {
const response = await fetch('config/config.json');
const configData = await response.json();

// Atualizar configurações
CONFIG.maxChars = configData.editor.maxChars;
CONFIG.sheetId = configData.googleSheets.sheetId;
CONFIG.sheetUrl = configData.googleSheets.sheetUrl;

console.log('Configurações carregadas:', CONFIG);
} catch (error) {
console.warn('Erro ao carregar configurações, usando padrões:', error);
}
}

// Elementos DOM
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
// Toolbar
boldBtn: document.getElementById('boldBtn'),
italicBtn: document.getElementById('italicBtn'),
underlineBtn: document.getElementById('underlineBtn'),
emojiBtn: document.getElementById('emojiBtn'),
emojiGrid: document.getElementById('emojiGrid')
};

// Estado da aplicação
let state = {
selectedFile: null,
isUploading: false,
isSending: false
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
await loadConfig();
initializeEventListeners();
updateCharCount();
});

// Event Listeners
function initializeEventListeners() {
// Upload de arquivo
elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
elements.fileInput.addEventListener('change', handleFileSelect);
elements.removeFile.addEventListener('click', removeFile);
elements.uploadBtn.addEventListener('click', uploadFile);

// Editor de texto
elements.textEditor.addEventListener('input', updateCharCount);
elements.textEditor.addEventListener('paste', handlePaste);
elements.clearBtn.addEventListener('click', clearEditor);
elements.sendBtn.addEventListener('click', sendWebhook);

// Toolbar
elements.boldBtn.addEventListener('click', () => toggleFormat('bold'));
elements.italicBtn.addEventListener('click', () => toggleFormat('italic'));
elements.underlineBtn.addEventListener('click', () => toggleFormat('underline'));

// Emojis
elements.emojiGrid.addEventListener('click', handleEmojiClick);
document.addEventListener('click', (e) => {
if (!elements.emojiBtn.contains(e.target) && !elements.emojiGrid.contains(e.target)) {
elements.emojiGrid.style.display = 'none';
}
});
}

// Funções de Upload
function handleFileSelect(e) {
const file = e.target.files[0];
if (file) {
handleFile(file);
}
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

// Funções do Editor
function updateCharCount() {
const content = elements.textEditor.textContent || '';
const count = content.length;

elements.charCount.textContent = count;
elements.charCount.className = 'char-counter';

if (count > CONFIG.maxChars * 0.9) {
elements.charCount.classList.add('warning');
}
if (count > CONFIG.maxChars) {
elements.charCount.classList.add('error');
}

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

function toggleFormat(command) {
document.execCommand(command, false, null);
elements.textEditor.focus();
updateToolbarState();
}

function updateToolbarState() {
elements.boldBtn.classList.toggle('active', document.queryCommandState('bold'));
elements.italicBtn.classList.toggle('active', document.queryCommandState('italic'));
elements.underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
}

function handleEmojiClick(e) {
if (e.target.classList.contains('emoji')) {
const emoji = e.target.dataset.emoji;
insertEmoji(emoji);
elements.emojiGrid.style.display = 'none';
}
}

function insertEmoji(emoji) {
const selection = window.getSelection();
if (selection.rangeCount > 0) {
const range = selection.getRangeAt(0);
range.deleteContents();
range.insertNode(document.createTextNode(emoji));
range.collapse(false);
selection.removeAllRanges();
selection.addRange(range);
} else {
elements.textEditor.focus();
document.execCommand('insertText', false, emoji);
}
updateCharCount();
}

async function sendWebhook() {
if (state.isSending) return;

const message = elements.textEditor.innerHTML;
if (!message.trim()) {
showToast('Aviso', 'Digite uma mensagem antes de enviar', 'warning');
return;
}

state.isSending = true;
elements.sendBtn.classList.add('loading');
elements.sendBtn.disabled = true;

const payload = {
message: message,
sheetId: CONFIG.sheetId,
sheetUrl: CONFIG.sheetUrl,
metadata: {
timestamp: new Date().toISOString(),
charCount: message.length
}
};

try {
const response = await fetch("https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12", {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify(payload)
});

if (!response.ok) {
throw new Error(`HTTP error! status: ${response.status}`);
}

        const result = await response.json();

        if (result.success) {
            showToast('Sucesso', 'Webhook enviado com sucesso!', 'success');
        } else {
            showToast('Erro', result.message || 'Erro ao enviar webhook', 'error');
        }
} catch (error) {
console.error('Erro ao enviar webhook:', error);
showToast('Erro', 'Erro de conexão ao enviar webhook', 'error');
@@ -242,27 +246,24 @@

// Funções de UI
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'Mensagens enviada com sucesso' ? '✅' : type === 'error' ? '✅' : '⚠️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function formatFileSize(bytes) {
