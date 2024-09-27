const { requestWrapperPOST } = require('../api/apiClient');
const { sendMessageToNumber } = require('./sendMessageToNumber');

async function handleAssociateRefer(client, message, phoneNumber, refer, apiUrl,userState){
    
    let endpoint = `${apiUrl}/api/add-reffer/`;
    let obj = {
        refer : refer,
        phone_number : phoneNumber
    };

    try {
        if (userState[phoneNumber] && userState[phoneNumber].action === 'addrefer') {
            const response = await requestWrapperPOST(endpoint, obj);
            const result = await response.json();
            
            // Mostrar los resultados en la consola
            if (result.error) {
                console.error(`Error: ${result.error}`);
                await message.reply(result.error);
            } else {
                console.log(`Mensaje: ${result.message}`);
                await message.reply(`${result.message}`);
            }
            
            
            //await message.reply(`${result.message}` || `${result.error}`);

            if(!result.error && result.referrer){
                await sendMessageToNumber(client, result.referrer, `*has agregado a +${result.from_number} como referido*🤜🏽​🤛🏽​`);
            }
            
        }

        delete userState[phoneNumber].action;

    } catch (error) {
        console.error('Error en la solicitud:', error);
        // Responder en caso de error en la solicitud
        await message.reply('*Ocurrió un error al registrar el referido*❌.');
    }
}

module.exports =  handleAssociateRefer ;