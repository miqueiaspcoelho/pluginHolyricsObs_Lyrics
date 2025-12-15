    // server_ws.js (Corrigido)

    const WebSocket = require('ws');
    const fetch = require('node-fetch');
    const { limparTextoEExtrair,getLocalIpAddress} = require('./server_functions');

    // --- Configurações de Endereços ---
    const PORTA_SERVER_NODE = 3000;
    const localIp = getLocalIpAddress(); 
    // Assumimos que o Holyrics está rodando na mesma máquina na porta 80
    const HOLYRCS_API_URL = `http://${localIp}:80/view/text.json`; 
    const POLLING_INTERVAL_MS = 100;

    let ultimaLetraTransmitida = "inicial"; 
    const wss = new WebSocket.Server({ port: PORTA_SERVER_NODE });

    let holyricsIsReachable = false;
    let statusCallback = () => {}; 

    /**
     * Atualiza o status de reachability da Holyrics API.
     * @param {boolean} isReachable 
     */
    function updateHolyricsStatus(isReachable) {
        if (holyricsIsReachable !== isReachable) {
            holyricsIsReachable = isReachable;
            statusCallback(holyricsIsReachable); 
            const statusMsg = holyricsIsReachable ? "ONLINE" : "OFFLINE";
            console.log(`[STATUS API] Holyrics API mudou para: ${statusMsg}`);
        }
    }

    // async function fetchAndTransmit() {
    //     try {
    //         const response = await fetch(HOLYRCS_API_URL);
            
    //         if (!response.ok) {
    //             // Se o servidor Holyrics respondeu, mas deu erro HTTP, ainda está 'acessível' tecnicamente
    //             // Mas, para o nosso propósito, se não retornar 200/OK, consideramos que não está transmitindo dados válidos.
    //             updateHolyricsStatus(false); 
    //             throw new Error(`Erro HTTP: ${response.status}`);
    //         }
            
    //         // CORREÇÃO: Se a requisição foi bem-sucedida (status 200/OK)
    //         updateHolyricsStatus(true);
            
    //         const jsonResponse = await response.json();
            
    //         const letraPura = limparTextoEExtrair(jsonResponse);
            
    //         transmitirLetra(letraPura);

    //     } catch (error) {
    //         // Se houver erro de rede (ECONNREFUSED, ENOTFOUND), a API está inacessível
    //         updateHolyricsStatus(false);
    //         const msg = error.message;
    //         if (!msg.includes('ECONNREFUSED') && !msg.includes('ENOTFOUND') && !msg.includes('Erro HTTP')) {
    //              // console.error(`[ERRO FETCH] Falha ao buscar text.json: ${msg}`);
    //         }
    //     }
    // }
    // server_ws.js (Apenas a função fetchAndTransmit, com novos logs de depuração)

    async function fetchAndTransmit() {
        console.log(`[DEBUG] Tentando buscar URL: ${HOLYRCS_API_URL}`); // ⬅️ NOVO LOG 1
        
        try {
            const response = await fetch(HOLYRCS_API_URL);
            
            if (!response.ok) {
                updateHolyricsStatus(false); 
                console.error(`[DEBUG] Erro HTTP: ${response.status} ao buscar Holyrics.`); // ⬅️ NOVO LOG 2
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            // Se a requisição foi bem-sucedida (status 200/OK)
            updateHolyricsStatus(true);
            console.log(`[DEBUG] Holyrics API respondeu com sucesso (Status 200).`); // ⬅️ NOVO LOG 3
            
            const textResponse = await response.text(); // ⬅️ NOVO: Pegamos o texto bruto
            const jsonResponse = JSON.parse(textResponse); // ⬅️ NOVO: Tentamos parsear manualmente
            
            console.log(`[DEBUG] JSON Recebido:`, jsonResponse); // ⬅️ NOVO LOG 4

            const letraPura = limparTextoEExtrair(jsonResponse);
            
            console.log(`[DEBUG] Letra Limpa/Extraída: "${letraPura}"`); // ⬅️ NOVO LOG 5
            
            transmitirLetra(letraPura);

        } catch (error) {
            // Se houver erro de rede (ECONNREFUSED, ENOTFOUND) ou erro de Parseamento
            updateHolyricsStatus(false);
            const msg = error.message;
            
            // Exibe o erro de rede ou o erro de JSON.parse
            if (!msg.includes('ECONNREFUSED') && !msg.includes('ENOTFOUND') && !msg.includes('Erro HTTP')) {
                console.error(`[ERRO CRÍTICO] Falha ao buscar ou processar text.json. Erro: ${msg}`); // ⬅️ NOVO LOG 6
                console.error(`O conteúdo recebido foi JSON Inválido?`);
            } else {
                console.error(`[ERRO DE REDE/HTTP] Falha na comunicação com o Holyrics. Erro: ${msg}`);
            }
        }
    }

    /**
     * Transmite a letra para todos os clientes WS.
     * @param {string} letra_atual 
     * @returns {void}
     */
    function transmitirLetra(letra_atual) {
        console.log(`[DEBUG TRANSMITIR] Conteúdo recebido para broadcast: ${letra_atual.length} caracteres.`); // NOVO LOG
        if (letra_atual === ultimaLetraTransmitida) return;
        
        ultimaLetraTransmitida = letra_atual;

        const conteudoParaEnviar = letra_atual;

        const mensagem = JSON.stringify({
            tipo: 'letra',
            conteudo: conteudoParaEnviar
        });
        
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(mensagem);
            }
        });

        const logMensagem = letra_atual.length > 0 ? `"${letra_atual.replace(/\n/g, ' ')}"` : "SLIDE VAZIO (FIM DA MÚSICA)";
        // console.log(`[BROADCAST] Enviado: ${logMensagem}`);
    }


    /**
     * Inicializa o Servidor WebSocket e o Polling, e define o callback de status.
     * @param {function} statusReporterCallback - Função chamada com true/false quando o status da API muda.
     * @returns {number} A porta do servidor WS.
     */
    function startWsServer(statusReporterCallback) {
        statusCallback = statusReporterCallback; // Armazena a função do main.js

        wss.on('listening', () => {
            console.log(`[SERVER WS] Servidor WS para clientes rodando na porta ${PORTA_SERVER_NODE}`);
            
            // 1. Executa a busca imediatamente para definir o status inicial
            fetchAndTransmit(); 
            
            // 2. Inicia o Polling HTTP
            pollingTimer = setInterval(fetchAndTransmit, POLLING_INTERVAL_MS); 
        });

        wss.on('connection', (ws) => {
            console.log(`[CONEXÃO] Novo cliente conectado.`);
            // Envia o último estado da tela para o novo cliente
            if (ultimaLetraTransmitida) {
                ws.send(JSON.stringify({ tipo: 'letra', conteudo: ultimaLetraTransmitida }));
            }
        });
        
        return PORTA_SERVER_NODE;
    }

    module.exports = startWsServer;