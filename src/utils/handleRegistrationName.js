const registerProfile = require('../api/registerProfile');
//const userState = require('./userState');

// Función para manejar la espera de un nombre de usuario
async function handleRegistrationName(message, phoneNumber, apiUrl, userState){
    if (userState[phoneNumber] && userState[phoneNumber].action === 'register') {
        const lowerCaseMsg = message.body.trim().toLowerCase();
        const name = lowerCaseMsg; // Obtener el nombre ingresado por el usuario

        // Verificar que el nombre no esté vacío
        if (!name) {
            await message.reply('⚠️ Por favor, *ingresa un nombre válido*.');
            return;
        }

        const obj = { 
            name: name,
            phone_number: phoneNumber
        };

        try {
            const resolve = await registerProfile(apiUrl, obj);
            if (resolve) await message.reply(resolve);

        } catch (error) {
            console.error('Error al registrar el perfil:', error);
            await message.reply('⚠️ Ocurrió un error al registrar tu perfil. Inténtalo de nuevo más tarde.');
        }

        // Finalizar el registro y eliminar el estado pendiente
        delete userState[phoneNumber];
    }
}

module.exports =  handleRegistrationName ;