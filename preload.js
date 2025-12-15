// preload.js

const { contextBridge, ipcRenderer } = require('electron');

/**
 * contextBridge.exposeInMainWorld() expõe APIs específicas e seguras 
 * para o ambiente isolado do Renderer.
 * * Isso permite que o código em renderer.js chame métodos sem ter 
 * acesso direto ao módulo 'require' ou 'process' do Node.js.
 */
contextBridge.exposeInMainWorld('api', {
    
    /**
     * Define um listener para receber informações do Main Process.
     * * O Main Process (main.js) envia as informações de conexão (IP, Portas)
     * através do canal 'connection-info'.
     * * @param {function} callback - Função que será executada com os dados de status.
     */
    onConnectionInfo: (callback) => {
        // Usa ipcRenderer.on para escutar o canal 'connection-info'
        // Cria uma função wrapper para evitar que o evento IPCRenderer seja exposto.
        ipcRenderer.on('connection-info', (event, info) => callback(info));
    },
    
    // Futuras chamadas do Renderer para o Main (ex: reiniciar servidor)
    // Exemplo: restartServer: () => ipcRenderer.send('restart-server')
});