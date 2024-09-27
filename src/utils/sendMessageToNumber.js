// Función para enviar un mensaje a un número de teléfono
async function sendMessageToNumber(client, phoneNumber, message) {
    // Asegúrate de que el número esté en formato internacional
    const formattedNumber = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    try {
        const chat = await client.getChatById(formattedNumber);
        await chat.sendMessage(message);
        console.log(`Mensaje enviado a ${phoneNumber}: ${message}`);

    } catch (error) {

        console.error(`Error al enviar mensaje a ${phoneNumber}:`, error);

    }

}

module.exports = sendMessageToNumber;