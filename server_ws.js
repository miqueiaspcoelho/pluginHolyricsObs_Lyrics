const WebSocket = require('ws');
const { limparTextoEExtrair, getLocalIpAddress } = require('./server_functions');

// ---------------- CONFIG ----------------
const PORTA_SERVER_NODE = 3000;
const POLLING_INTERVAL_MS = 100;
// ---------------------------------------

let wss = null;
let pollingInterval = null;
let ultimaLetraTransmitida = 'inicial';

/**
 * Inicia o servidor WebSocket e o polling do Holyrics
 * @param {(isReachable: boolean) => void} onHolyricsStatusChange
 * @returns {number} porta do WS
 */
function startWsServer(onHolyricsStatusChange) {
    const localIp = getLocalIpAddress();
    const HOLYRCS_API_URL = `http://${localIp}:80/view/text.json`;

    // Cria o servidor SOMENTE quando chamado
    wss = new WebSocket.Server({ port: PORTA_SERVER_NODE });

    async function fetchAndTransmit() {
        try {
            const response = await fetch(HOLYRCS_API_URL);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const jsonResponse = await response.json();
            const letraPura = limparTextoEExtrair(jsonResponse);

            transmitirLetra(letraPura);
            onHolyricsStatusChange?.(true);

        } catch (err) {
            onHolyricsStatusChange?.(false);
        }
    }

    function transmitirLetra(letra_atual) {
        if (letra_atual === ultimaLetraTransmitida) return;

        ultimaLetraTransmitida = letra_atual;

        const mensagem = JSON.stringify({
            tipo: 'letra',
            conteudo: letra_atual
        });

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(mensagem);
            }
        });
    }

    // ---------------- EVENTOS ----------------
    wss.on('listening', () => {
        pollingInterval = setInterval(
            fetchAndTransmit,
            POLLING_INTERVAL_MS
        );
    });

    wss.on('connection', ws => {
        if (ultimaLetraTransmitida !== 'inicial') {
            ws.send(JSON.stringify({
                tipo: 'letra',
                conteudo: ultimaLetraTransmitida
            }));
        }
    });

    return PORTA_SERVER_NODE;
}

module.exports = startWsServer;