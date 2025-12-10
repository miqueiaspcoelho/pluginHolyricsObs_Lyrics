const os = require('os');

/**
 * sanitariza o texto que esta sendo recebido - removendo elementos html e deixando texto puro
 * @param {JSON} jsonResponse - objeto json completo que é enviado pelo endpoint do holyrics
 * @returns {string} - retorno com as legendas que estão sendo projetadas
 */
function limparTextoEExtrair(jsonResponse) {
    try {
        const rawText = jsonResponse.map.text;
        const type = jsonResponse.map.type; // Captura o tipo
        let textoReferencia = '';

        // ----------------------------------------------------
        // 1. EXTRAÇÃO E LIMPEZA DA REFERÊNCIA BÍBLICA
        // ----------------------------------------------------
        if (type === 'BIBLE' && jsonResponse.map.header) {
            let verseHeader = jsonResponse.map.header;
            
            // Remove a tag HTML <desc> da referência (ex: <desc>João 3:8</desc> -> João 3:8)
            textoReferencia = verseHeader.replace(/<[^>]*>/g, '').trim(); 
        }

        // ----------------------------------------------------
        // 2. TRATAMENTO DO CORPO DO TEXTO
        // ----------------------------------------------------
        if (typeof rawText !== 'string') {
            return ""; 
        }
        
        // A lógica de corte e limpeza é aplicada APENAS ao corpo do texto.
        
        // A. Procura pelo padrão "&nbsp;" e corta
        const indiceCorte = rawText.indexOf('&nbsp;');
        let textoCortado = rawText;

        if (indiceCorte !== -1) {
            textoCortado = rawText.substring(0, indiceCorte);
        }

        // B. Remove tags HTML e substitui quebras de linha (<br>)
        let textoLimpo = textoCortado.replace(/<[^>]*>/g, '').trim();
        textoLimpo = textoLimpo.replaceAll('<br>', '\n').trim();

        // ----------------------------------------------------
        // 3. CONCATENAÇÃO FINAL
        // ----------------------------------------------------
        if (textoReferencia.length > 0) {
            // Adiciona a referência ao final da string limpa, formatada com parênteses.
            textoLimpo += ` (${textoReferencia})`; 
        }

        return textoLimpo;

    } catch (e) {
        return ""; 
    }
}


/**
 * busca o ipv4 da máquina local, tornando todo o processo dinâmico, ainda que o ip mude devido variações de rede
 * @returns {string}
 */
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
                return net.address;
            }
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

module.exports = {
    limparTextoEExtrair,
    getLocalIpAddress
}