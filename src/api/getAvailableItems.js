const { requestWrapperGET } = require('./apiClient');

//--------------------------------OBTENER ITEMS DISPONIBLES-----------------------------------
async function getAvailableItems(apiUrl) {
    const endpoint = `${apiUrl}/api/get-avaliable-items/`;
    let message = '';

    try {
        const response = await requestWrapperGET(endpoint);
        const result = await response.json();

        if (result.error) {
            message = `*Error: ${result.error}*❌`;
        } else {
            message = "*Objetos disponibles para canje:*🗒️ \n";
            result.available_items.forEach((item, index) => {
                message += `*${index + 1}. ${item.name} - ID: ${item.id} - Puntos necesarios: ${item.points_required}*📦\n `;
            });
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        message = "❌*Ha ocurrido un error en la solicitud. Por favor, intenta nuevamente.*❌";
    }

    return message;
}

module.exports =  getAvailableItems ;