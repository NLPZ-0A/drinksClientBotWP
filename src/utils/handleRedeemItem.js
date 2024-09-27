const redeemItem = require('../api/redeemItem');
//const userState = require('./userState');

async function handleRedeemItem(message, phoneNumber, itemId, apiUrl, userState) {


    if (userState[phoneNumber] && userState[phoneNumber].action === 'redeem') {
        const object = { item_id: itemId, phone_number: phoneNumber, quantity : 1 };
        console.log(object);
        try {
            const resolve = await redeemItem(apiUrl, object);
            if (resolve) await message.reply(resolve);
            
        } catch (error) {
            console.error('Error al canjear el objeto:', error);
            await message.reply('⚠️ Ocurrió un error al procesar el canje del objeto. Inténtalo de nuevo más tarde.');
        }

        delete userState[phoneNumber];
    }
}


module.exports = handleRedeemItem;