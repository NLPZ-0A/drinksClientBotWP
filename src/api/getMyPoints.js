const { requestWrapperGET } = require('./apiClient');

async function getMyPoints(apiUrl, phoneNumber) {
    let endpoint = `${apiUrl}/api/points/${phoneNumber}/`;
    let message = '';

    console.log(`${phoneNumber} ha consultado sus puntos`);

    try {
        const response = await requestWrapperGET(endpoint);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`${result} obtenido`);
        
        if(result.error) {
            message = `*Error: ${result.error}*❌`;
        } else {
             message=`💰🍾Tienes: *${result.points} EscabioPoints.*🍾💰`;
        }


    }catch(error) {
        console.error('Error en la solicitud:', error);
        message = "❌*Ha ocurrido un error en la solicitud. Por favor, intenta nuevamente.*❌"; 
    }

    return message

}

module.exports = getMyPoints;