const { requestWrapperGET } = require('./apiClient');

async function getMyReferCode(apiUrl, phoneNumber){
    let endpoint = `${apiUrl}/api/code-refer/${phoneNumber}/`;
    let message = '';

    try {
        const response = await requestWrapperGET(endpoint);
        const result = await response.json();


        if (result.error) {
           message = `Error: ${result.error}❌`;
        } else {
            message = `🔐 Tu codigo de referido es: *${result.code}* `;
        }

    }catch(error) {
        console.error('Error en la solicitud:', error);
        
            message="*Ha ocurrido un error en el procesamiento de la solicitud!*⚠️";
    }
    
    return message;
}

module.exports = getMyReferCode;