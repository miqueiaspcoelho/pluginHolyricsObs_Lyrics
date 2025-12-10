const http = require('http');
const fs = require('fs');
const path = require('path');
const { limparTextoEExtrair,transmitirLetra, getLocalIpAddress} = require('./server_functions');
 

// --- Configurações ---
const PORTA_HTTP = 8080; 
const NOME_DO_CLIENTE = 'client_ws.html';
const HOST_PARA_LISTEN = '0.0.0.0'; 
const PORTA_WS = 3000;
// ---------------------


const localIp = getLocalIpAddress(); // Pega o IP dinâmico

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, NOME_DO_CLIENTE);
    
    if (req.url === '/' || req.url === `/${NOME_DO_CLIENTE}`) {
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end(`Erro Interno ao carregar ${NOME_DO_CLIENTE}.`);
            }
            
            // CONVERSÃO E SUBSTITUIÇÃO CRÍTICA
            let htmlContent = data.toString();
            
            // Substitui o placeholder no HTML pelo IP dinâmico real
            htmlContent = htmlContent.replace('__IP_DINAMICO__', localIp);
            
            // Envia o HTML modificado
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("Página não encontrada.");
    }
});

server.listen(PORTA_HTTP, HOST_PARA_LISTEN, () => {
    console.log("------------------------------------------------------------------");
    console.log(`✅ Servidor HTTP Rodando na porta ${PORTA_HTTP}`);
    console.log(`💻 Seu IP de Rede Local (PC 1): ${localIp}`);
    console.log(`📡 Cliente WS será conectado em: ws://${localIp}:${PORTA_WS}`);
    console.log("");
    console.log("🔗 URL para o OBS (PC 2):");
    console.log(`http://${localIp}:${PORTA_HTTP}/${NOME_DO_CLIENTE}`);
    console.log("------------------------------------------------------------------");
});