const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function logError(error, context = '') {
    const logDir = app.getPath('userData');
    const logFile = path.join(logDir, 'app.log');

    const timestamp = new Date().toISOString();

    const message = error instanceof Error
        ? `${error.message}\n${error.stack}`
        : String(error);

    const logEntry = `
[${timestamp}] ERROR ${context ? `(${context})` : ''}
${message}
--------------------------------------------------
`;

    fs.appendFile(logFile, logEntry, () => {});
}

module.exports = { logError };
