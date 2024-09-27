const { requestWrapperGET } = require('./apiClient');

async function getMyRedeemedItems(apiUrl, phoneNumber) {
    const endpoint = `${apiUrl}/api/get-my-items/${phoneNumber}/`;
    let message = '';

    try {
        const response = await requestWrapperGET(endpoint);
        const result = await response.json();

        console.log(result);
        if(result.message){
            console.log(result.message);
        }

        if(!result.message){
            if (result.error) {
                message = `*Error: ${result.error}*❌`;
            } else {
                if (result.redeemed_items.length === 0) {
                    message = "*No has canjeado ningún objeto todavía.* 🎁";
                } else {
                    message = "*Lista de objetos canjeados:* 🗒️ \n";
                    result.redeemed_items.forEach((redeemedItem, index) => {
                        const itemName = redeemedItem.item_name; // Suponiendo que `item` tiene un campo `name`
                        const redeemedAt = new Date(redeemedItem.redeemed_at).toLocaleDateString(); // Formatea la fecha

                        message += `*${index + 1}. ${itemName} - ID: ${redeemedItem.id} - Canjeado el: ${redeemedAt}*📦\n `;
                    });
                }
            }
        }else{
            message = result.message;
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        message = "❌*Ha ocurrido un error en la solicitud. Por favor, intenta nuevamente.*❌";
    }

    return message;
}

module.exports = getMyRedeemedItems;