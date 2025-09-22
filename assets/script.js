<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Envio em Massa - Sistema de Mensagens</title>
  <link rel="stylesheet" href="assets/styles.css"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>📤 Envio em Massa</h1>
      <p>Sistema de envio de mensagens em massa</p>
    </header>

    <main class="main-content">
      <!-- Seção de Upload de Planilha -->
      <section class="upload-section">
        <div class="card">
          <h2>📊 Carregar Planilha</h2>
          <div class="upload-area" id="uploadArea">
            <input type="file" id="fileInput" accept=".xlsx,.xls" style="display:none;" />
            <button class="btn btn-primary" id="uploadBtn">
              <span class="btn-text">Inserir dados</span>
            </button>
          </div>
          <div class="file-info" id="fileInfo" style="display:none;">
            <div class="file-details">
              <div class="file-name" id="fileName"></div>
              <div class="file-size" id="fileSize"></div>
            </div>
            <button class="btn btn-secondary" id="removeFile">Remover</button>
          </div>
        </div>
      </section>

      <!-- Seção de Editor -->
      <section class="editor-section">
        <div class="card">
          <h2>✏️ Editor de Mensagem</h2>

          <div class="editor-container">
            <div 
              class="editor"
              id="textEditor"
              contenteditable="true"
              data-placeholder="Digite sua mensagem aqui..."></div>
            <div class="char-counter">
              <span id="charCount">0</span>/2000 caracteres
            </div>
          </div>

          <!-- Upload de Imagem -->
          <div class="image-upload-section">
            <h3>🖼️ Anexar Imagem</h3>
            <input type="file" id="imageInput" accept="image/*" style="display:none;" />
            <button class="btn btn-outline" id="imageUploadBtn">📷 Selecionar Imagem</button>

            <div class="image-preview" id="imagePreview" style="display:none;">
              <img id="previewImg" src="" alt="Preview da imagem" />
              <button class="btn btn-remove" id="removeImageBtn">❌ Remover</button>
              <p><strong>URL pública:</strong> <span id="publicUrl"></span></p>
            </div>
          </div>

          <!-- Ações -->
          <div class="editor-actions">
            <button class="btn btn-secondary" id="clearBtn">🗑️ Limpar</button>
            <button class="btn btn-success" id="sendBtn">
              <span class="btn-text">📤 Enviar Webhook</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- Toast -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- Script -->
  <script src="assets/script.js" defer></script>
</body>
</html>
