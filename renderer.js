// renderer.js

// O objeto 'api' foi exposto pelo 'preload.js'
if (window.api) {
    
    // --- Referências aos Elementos do DOM ---
    const statusBadge = document.getElementById('status-badge');
    const statusBadgeHolyrics = document.getElementById('status-badge-holyrics');
    const ipAddressElement = document.getElementById('ip-address');
    const wsPortElement = document.getElementById('ws-port');
    const httpPortElement = document.getElementById('http-port');
    const holyricsStatusElement = document.getElementById('holyrics-status');
    
    // Referência ao SPAN que exibe a URL dentro da caixa
    const obsUrlDisplayElement = document.getElementById('obs-url-display'); 
    
    const copyButton = document.getElementById('copy-btn'); 
    
    // Variável para armazenar a URL que será copiada
    let currentObsUrl = "http://[AGUARDANDO IP]:8080/client_ws.html"; 

    // ---------------------------------------------------------------------
    // FUNÇÃO PARA ATUALIZAR A INTERFACE (onConnectionInfo)
    // ---------------------------------------------------------------------
    window.api.onConnectionInfo((info) => {
        
        // 1. Atualizar o Status Geral (Badge)
        if (info.isRunning) {
            statusBadge.textContent = "ATIVO";
            statusBadge.classList.remove('inactive');
            statusBadge.classList.add('active');
            if(info.holyricsIsReachable){
                statusBadge.textContent = "ATIVO";
                statusBadge.classList.remove('inactive');
                statusBadge.classList.add('active');
            }
        } else {
            statusBadge.textContent = "ERRO/INATIVO";
            statusBadge.classList.remove('active');
            statusBadge.classList.add('inactive');
        }
        
        // Status Holyrics API (assumido OK se o servidor WS estiver ativo)
        holyricsStatusElement.textContent = info.isRunning ? `OK (Porta 80)` : 'ERRO DE CONEXÃO';
        holyricsStatusElement.className = info.isRunning ? 'info-value active' : 'info-value inactive';


        // 2. Atualizar as Informações de Conexão
        ipAddressElement.textContent = info.localIp;
        wsPortElement.textContent = info.wsPort;
        httpPortElement.textContent = info.httpPort;

        // 3. Gerar e Exibir a URL Completa para o OBS
        let obsUrl = `http://${info.localIp}:${info.httpPort}/${info.clientPath}`;
        
        obsUrlDisplayElement.innerHTML = ''; 

        if (info.localIp === 'localhost' || info.localIp === '127.0.0.1' || info.localIp === '0.0.0.0') {
             // Caso de erro de IP: Força o placeholder e exibe o aviso
             obsUrl = `http://[IP_DA_REDE_LOCAL]:${info.httpPort}/${info.clientPath}`;
             
             const warningSpan = document.createElement('span');
             warningSpan.className = 'warning';
             warningSpan.textContent = "AVISO: IP de rede não detectado. Substitua [IP_DA_REDE_LOCAL] pelo IP real deste PC.";
             obsUrlDisplayElement.appendChild(warningSpan);
             
             obsUrlDisplayElement.appendChild(document.createElement('br'));
             obsUrlDisplayElement.appendChild(document.createElement('br'));
             obsUrlDisplayElement.appendChild(document.createTextNode(obsUrl));
             
        } else {
            // IP de rede real detectado
            obsUrlDisplayElement.textContent = obsUrl;
        }
        
        // Armazena a URL FINAL gerada para o botão de cópia
        currentObsUrl = obsUrl; 
    });

    // ---------------------------------------------------------------------
    // EVENT LISTENER PARA O BOTÃO DE CÓPIA (Funcionalidade de Copiar)
    // ---------------------------------------------------------------------
    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            // Verifica se temos uma URL válida antes de tentar copiar
            if (currentObsUrl && currentObsUrl.includes('http://') && !currentObsUrl.includes('[AGUARDANDO IP]')) {
                try {
                    // Usa a API do Clipboard do navegador (acessível no ambiente do Renderer)
                    await navigator.clipboard.writeText(currentObsUrl);
                    
                    // Feedback visual temporário
                    copyButton.textContent = '✅ Copiado!';
                    
                    // Volta ao texto original após 2 segundos
                    setTimeout(() => {
                        copyButton.textContent = '📋 Copiar';
                    }, 2000);
                    
                } catch (err) {
                    console.error('Falha ao copiar:', err);
                    copyButton.textContent = '❌ Erro!';
                    
                    setTimeout(() => {
                        copyButton.textContent = '📋 Copiar';
                    }, 2000);
                }
            } else {
                 // Feedback se o usuário tentar copiar antes de o IP ser resolvido
                 copyButton.textContent = 'Aguarde...';
                 setTimeout(() => {
                    copyButton.textContent = '📋 Copiar';
                }, 1000);
            }
        });
    }

} else {
    // Caso de falha de carregamento do preload.js
    console.error("A comunicação IPC (window.api) não está disponível.");
    document.getElementById('status-badge').textContent = 'FALHA INTERNA';
}