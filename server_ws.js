const WebSocket = require('ws');
const { limparTextoEExtrair,getLocalIpAddress} = require('./server_functions');

// --- Configurações de Endereços ---
const PORTA_SERVER_NODE = 3000;
const localIp = getLocalIpAddress(); 
const HOLYRCS_API_URL = `http://${localIp}:80/view/text.json`; 
const POLLING_INTERVAL_MS = 100; // Velocidade de Polling

let ultimaLetraTransmitida = "inicial"; // Valor inicial diferente de vazio
const wss = new WebSocket.Server({ port: PORTA_SERVER_NODE });

async function fetchAndTransmit() {
    try {
        const response = await fetch(HOLYRCS_API_URL);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const jsonResponse = await response.json();
        
        const letraPura = limparTextoEExtrair(jsonResponse);
        
        // Chama a função que agora permite string vazia como um estado válido
        transmitirLetra(letraPura);

    } catch (error) {
        // Log de erro de rede, etc.
        const msg = error.message;
        if (!msg.includes('ECONNREFUSED') && !msg.includes('ENOTFOUND')) {
             // console.error(`[ERRO FETCH] Falha ao buscar text.json: ${msg}`);
        }
    }
}

/**
 * 
 * @param {string} letra_atual 
 * @returns {void}
 */
function transmitirLetra(letra_atual) {
    // *** AJUSTE CRÍTICO: Permite transmitir string vazia ('') se for diferente do último estado ***
    if (letra_atual === ultimaLetraTransmitida) return;
    
    ultimaLetraTransmitida = letra_atual;

    // Se a letra for uma string vazia, o cliente deve limpar a tela.
    const conteudoParaEnviar = letra_atual;

    const mensagem = JSON.stringify({
        tipo: 'letra',
        conteudo: conteudoParaEnviar // Será "" se o slide for vazio
    });
    
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(mensagem);
        }
    });

    const logMensagem = letra_atual.length > 0 ? `"${letra_atual.replace(/\n/g, ' ')}"` : "SLIDE VAZIO (FIM DA MÚSICA)";
    // console.log(`[BROADCAST] Enviado: ${logMensagem}`);
}


// ----------------------------------------------------
// 1. Setup do Servidor WebSocket
// ----------------------------------------------------

wss.on('listening', () => {
    console.log(`[SERVER NODE] Servidor WS para clientes rodando na porta ${PORTA_SERVER_NODE}`);
    console.log(`[POLLING] Buscando a letra a cada ${POLLING_INTERVAL_MS}ms em: ${HOLYRCS_API_URL}`);
    setInterval(fetchAndTransmit, POLLING_INTERVAL_MS); 
});

wss.on('connection', (ws) => {
    console.log(`[CONEXÃO] Novo cliente conectado.`);
    // Envia o último estado da tela para o novo cliente
    if (ultimaLetraTransmitida) {
        ws.send(JSON.stringify({ tipo: 'letra', conteudo: ultimaLetraTransmitida }));
    }
});



// ----------------------------------------------------
// 3. Polling HTTP para buscar o JSON
// ----------------------------------------------------
