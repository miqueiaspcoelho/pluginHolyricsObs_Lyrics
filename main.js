// main.js

const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os'); // Adicionado para obter o hostname para URL do OBS

// ⚠️ Seus módulos de servidor devem EXPORTAR a função de inicialização
const startWsServer = require('./server_ws'); 
const startHttpServer = require('./mini_http_server'); 
// Nota: 'server_functions.js' é usado internamente pelos outros e não precisa ser importado aqui.

// Variáveis de Controle
let tray = null;
let mainWindow = null;
let serverStatus = {
  isRunning: false,
  holyricsIsReachable: false,
  wsPort: 3000,
  httpPort: 8080,
  localIp: os.hostname(), // Será atualizado com o IP real pelo startHttpServer
  clientPath: 'client_ws.html'
};

// -----------------------------------------------------
// FUNÇÃO PRINCIPAL: CRIAÇÃO DA JANELA DE STATUS
// -----------------------------------------------------
function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus(); // Se já existe, apenas foca
    return;
  }
  
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    show: false, 
    resizable: false,
    
    title: 'Plugin Holyrics OBS - Status',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') 
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Envia o status atual para o Renderer assim que a janela estiver pronta
    mainWindow.webContents.send('connection-info', serverStatus);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -----------------------------------------------------
// CRIAÇÃO DA BANDEJA (TRAY)
// -----------------------------------------------------
function createTray() {
  // Caminho absoluto para o ícone (crie uma pasta 'assets' e coloque um ícone .png ou .ico)
  const iconPath = path.join(__dirname, 'assets', 'icon.png'); 
  
  // Use um ícone padrão do Electron se 'icon.png' não existir para não quebrar.
  // Você DEVE criar o arquivo 'assets/icon.png'
  try {
      tray = new Tray(iconPath);
  } catch(e) {
      console.warn("Ícone 'assets/icon.png' não encontrado. Usando ícone de fallback.");
      tray = new Tray(path.join(process.resourcesPath, 'icon.png')); 
  }

  // Atualiza a ToolTip
  updateTrayTooltip();

  // Menu de Contexto (Botão direito)
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Mostrar Configurações/Status', 
      type: 'normal',
      click: createMainWindow 
    },
    { type: 'separator' },
    { 
      label: 'Sair do Plugin', 
      type: 'normal',
      click: () => app.quit() 
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Ação no clique (Botão esquerdo)
  tray.on('click', createMainWindow);
}

// -----------------------------------------------------
// FUNÇÕES AUXILIARES
// -----------------------------------------------------

function updateTrayTooltip() {
    // Agora verifica o status da Holyrics API
    const statusText = serverStatus.holyricsIsReachable ? 'Holyrics OK' : (serverStatus.isRunning ? 'Aguardando Holyrics' : 'Erro');
    const ipDisplay = serverStatus.localIp === 'localhost' ? 'Verifique a rede' : serverStatus.localIp;
    tray.setToolTip(`Plugin Holyrics OBS | Status: ${statusText}\nIP: ${ipDisplay}:${serverStatus.httpPort}`);
}
function handleHolyricsStatusChange(isReachable) {
    serverStatus.holyricsIsReachable = isReachable;
    updateTrayTooltip();
    
    // Se a janela estiver aberta, envia a atualização imediatamente
    if (mainWindow && !mainWindow.isDestroyed()) {
        sendInitialStatusToRenderer(); 
    }
}


// -----------------------------------------------------
// INICIALIZAÇÃO DO APP E SERVIDORES
// -----------------------------------------------------

app.whenReady().then(() => {
  // 1. Inicia os servidores Node.js
  try {
    const wsPort = startWsServer(handleHolyricsStatusChange); 
    const httpInfo = startHttpServer(); // Deve retornar { localIp, PORTA_HTTP, NOME_DO_CLIENTE }

    // Atualiza o estado global
    serverStatus.isRunning = true;
    serverStatus.wsPort = wsPort;
    serverStatus.httpPort = httpInfo.PORTA_HTTP;
    serverStatus.localIp = httpInfo.localIp;
    serverStatus.clientPath = httpInfo.NOME_DO_CLIENTE;
    
    console.log("Servidores de Holyrics/WS e HTTP iniciados com sucesso.");

  } catch (error) {
    serverStatus.isRunning = false;
    console.error("Erro ao iniciar um ou ambos os servidores:", error);
    // Notifica o usuário na bandeja
    tray.displayBalloon({
      title: 'Erro de Inicialização',
      content: 'Não foi possível iniciar o servidor. Verifique se as portas estão livres.'
    });
  }

  // 2. Cria o ícone da bandeja
  createTray();

  // Oculta o ícone padrão da dock no macOS para apps de bandeja
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

// Impede que o app feche quando a janela de status é fechada.
app.on('window-all-closed', (event) => {
    // Apenas fecha se for macOS e o usuário não quer o app de bandeja.
    // Para Windows/Linux, o app continua rodando na bandeja.
    // event.preventDefault() pode ser usado aqui se você quiser FORÇAR o app a ficar rodando 
    // mesmo que o usuário tente fechar a janela, mas vamos seguir o padrão do Electron.
    if (process.platform !== 'darwin') {
      // Deixe o app rodando
    }
});

// Ações de limpeza antes de encerrar
app.on('before-quit', () => {
    // Seus servidores Node.js baseados em 'http' e 'ws' não requerem uma função
    // de 'stop' explícita, pois o encerramento do processo 'main.js' libera a porta.
    console.log("Encerrando processo principal...");
});