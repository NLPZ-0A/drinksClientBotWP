const fetch = require('node-fetch');

async function redeemItem(apiUrl, object) {
    const endpoint = `${apiUrl}/api/redeem-item/`;
    let message = '';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(object),
        });

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();

            if (result.error) {
                message = `*Error: ${result.error}*❌`;
            } else {
                message = `🎉*¡Has canjeado el objeto ${result.item.name} exitosamente! 🎉*\n*¡Disfruta tu recompensa!*`;
            }
        } else {
            // Manejar respuestas que no sean JSON
            message = "❌*La respuesta del servidor no es JSON. Por favor, verifica el servidor.*❌";
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        message = "❌*Ha ocurrido un error en el canje del objeto. Por favor, intenta nuevamente.*❌";
    }

    return message;
}

module.exports = redeemItem;