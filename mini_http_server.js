const http = require('http');
const fs = require('fs');
const path = require('path');
const { getLocalIpAddress } = require('./server_functions');

// --- Configurações ---
const PORTA_HTTP = 8080;
const NOME_DO_CLIENTE = 'client_ws.html';
const HOST_PARA_LISTEN = '0.0.0.0';
const PORTA_WS = 3000;

let server = null;

function startHttpServer() {
    const localIp = getLocalIpAddress();

    server = http.createServer((req, res) => {
        const filePath = path.join(__dirname, NOME_DO_CLIENTE);

        if (req.url === '/' || req.url === `/${NOME_DO_CLIENTE}`) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Erro ao carregar cliente WS');
                }

                let htmlContent = data.toString();
                htmlContent = htmlContent.replace('__IP_DINAMICO__', localIp);

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(htmlContent);
            });
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    server.listen(PORTA_HTTP, HOST_PARA_LISTEN, () => {
        console.log(`✅ HTTP rodando em http://${localIp}:${PORTA_HTTP}/${NOME_DO_CLIENTE}`);
        console.log(`📡 WS em ws://${localIp}:${PORTA_WS}`);
    });

    return {
        localIp,
        PORTA_HTTP,
        NOME_DO_CLIENTE
    };
}

module.exports = startHttpServer;
