# 🎶 Monitor de Letras Holyrics para OBS (WebSocket)

Este projeto Node.js cria um servidor WebSocket para monitorar o status das letras e versículos projetados pelo software **Holyrics**. Ele extrai o texto puro da API do Holyrics e o transmite instantaneamente (em tempo real) para uma fonte de navegador no OBS Studio, permitindo sobrepor legendas profissionais na sua transmissão.

---

## ✨ Funcionalidades Principais

* **Extração de Texto Puro:** Remove tags HTML, `&nbsp;`, e caracteres indesejados da API do Holyrics.
* **Referência Bíblica:** Inclui automaticamente a referência (`Livro Capítulo:Versículo`) ao final do texto, quando um versículo é projetado.
* **Transparência e Estilização:** O cliente HTML é otimizado para OBS, com fundo transparente, *fade-in/out* e fontes profissionais (`Calibri`).
* **Conexão Dinâmica:** Detecta o endereço IP da máquina local automaticamente, simplificando a configuração de rede entre dois PCs (Servidor e OBS).
* **Execução Simples:** Utiliza o `concurrently` para rodar ambos os servidores (HTTP e WebSocket) com um único comando.

---

## 🚀 Pré-requisitos

Certifique-se de que os seguintes itens estejam instalados e configurados:

1.  **[Node.js](https://nodejs.org/):** Ambiente de execução JavaScript (necessário para os servidores).
2.  **Holyrics:** Deve estar rodando e acessível na rede (geralmente na porta `80`).

## 📋 Estrutura do Projeto

Crie uma pasta para o projeto e adicione os seguintes arquivos:

```bash
holyrics-monitor/
│
├── node_modules/       # (Gerado por `npm install`)
├── package.json        # (Contém os scripts e dependências)
├── server_ws.js        # Servidor WebSocket (faz o polling do Holyrics)
├── mini_http_server.js # Servidor HTTP (entrega o HTML para o OBS)
├── serverFunctions.js  # Módulo de Funções Reutilizáveis (IP dinâmico, sanitização)
└── client_ws.html      # Cliente HTML/CSS (A ser usado como Fonte de Navegador no OBS)

# 2. Instala todas as dependências listadas no package.json
npm install