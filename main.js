const { app, Tray, Menu, clipboard  } = require('electron');
const path = require('path');

// ---- Servidores ----
const startWsServer = require('./server_ws');
const startHttpServer = require('./mini_http_server');

let tray = null;

let serverStatus = {
    isRunning: false,
    holyricsIsReachable: false,
    wsPort: 3000,
    httpPort: 8080,
    localIp: 'localhost',
    clientPath: 'client_ws.html'
};

// Callback do WS para atualizar o tooltip
function handleHolyricsStatusChange(isReachable) {
    serverStatus.holyricsIsReachable = isReachable;
    updateTrayTooltip();
}

// Atualiza a tooltip da bandeja
function updateTrayTooltip() {
    const statusText = serverStatus.holyricsIsReachable ? 'Holyrics: Conectado ✅' : 'Holyrics: Offline ❌';
    const ipText = `OBS URL: http://${serverStatus.localIp}:${serverStatus.httpPort}/${serverStatus.clientPath}`;
    tray.setToolTip(`${statusText}\n${ipText}`);
}


// Inicializa o tray
function createTray() {
    const iconPath = path.join(__dirname, 'assets/music_note_icon-icons.com_49870.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Atualizar Status', click: updateTrayTooltip },
        { type: 'separator' },
        { label: 'Sair', click: () => app.quit() }
    ]);

    tray.setContextMenu(contextMenu);
     tray.on('click', () => {
        const obsURL = `http://${serverStatus.localIp}:${serverStatus.httpPort}/${serverStatus.clientPath}`;
        clipboard.writeText(obsURL);
        // console.log(`[COPY] URL do OBS copiada: ${obsURL}`);
        tray.displayBalloon({
            title: 'URL Copiada',
            content: obsURL
        });
    });

    // ⚡ Atualiza o tooltip imediatamente com dados iniciais
    updateTrayTooltip();
}


// Inicialização do app
app.whenReady().then(() => {
    try {
        // 1️⃣ Inicia WS server
        startWsServer(handleHolyricsStatusChange);

        // 2️⃣ Inicia HTTP server
        const httpInfo = startHttpServer();
        serverStatus.localIp = httpInfo.localIp;
        serverStatus.httpPort = httpInfo.PORTA_HTTP;
        serverStatus.clientPath = httpInfo.NOME_DO_CLIENTE;

        serverStatus.isRunning = true;
        console.log('✅ Servidores iniciados, tray pronto!');
    } catch (err) {
        console.error('❌ Falha ao iniciar servidores:', err);
    }

    // 3️⃣ Cria o tray
    createTray();
});

// Mantém o app rodando mesmo sem janela
app.on('window-all-closed', (e) => {
    e.preventDefault();
});
