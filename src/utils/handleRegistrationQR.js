const { requestWrapperPOST } = require('../api/apiClient');
const { sendMessageToNumber } = require('./sendMessageToNumber');


async function handleRegistrationQR(client, message, phoneNumber, qrCode_, apiUrl, userState){

    let endpoint = `${apiUrl}/api/register-qr/`;
    let qrCode = qrCode_; // Obtener el qr

    if (userState[phoneNumber] && userState[phoneNumber].action === 'add-Qr') {
        
        
        let object = {
            qr_code: qrCode, 
            phone_number: phoneNumber
        }
        
        const response = await requestWrapperPOST(endpoint, object)
        const result = await response.json();

        await message.reply(result.message || result.error);

        console.log('resultado');
        console.log(result);
        
        if(result.message_gift !== '' && result.message !== undefined){
            await message.reply(result.message_gift)
        }
        
       
        
        if(result.referrer_number && result.message_refer){

            await sendMessageToNumber(client ,result.referrer_number, result.message_refer);
        }
    }
        
        // Finalizar el registro y eliminar el estado pendiente
    delete userState[phoneNumber].action;

    console.log(userState);
    console.log("salimos...");
    
    return
}

module.exports = handleRegistrationQR ;