const fs = require('fs');
const fetch = require('node-fetch');
const { prependListener } = require('process');
const { handleAssociateRefer, 
        handleRedeemItem, 
        handleRegistrationName, 
        handleRegistrationQR,
        userState } = require('./src/utils');

const { getMyPoints, getMyReferCode,
        getMyRefferrals, getMyRedeemedItems,
        getAvailableItems
      } = require('./src/api');
       
const qrcode = require('qrcode-terminal');
const { CLIENT_RENEG_LIMIT } = require('tls');
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');

//const apiUrl = 'https://127.0.0.1/';
const apiUrl = 'https://backenddrinkapp.onrender.com/';
// Crear el cliente con autenticación local
const client = new Client({
    authStrategy: new LocalAuth() // Guarda la sesión localmente
});

// Evento QR
client.on('qr', (qr) => {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR con WhatsApp.');
});

// Cliente listo
client.on('ready', () => {
    console.log('El bot está listo.');
});

// Objeto para almacenar números de teléfono en proceso de registrar su nombre
let pendingRegistration = {}; 
// Objeto para rastrear el estado de espera
//let userState = {};


//--------------------------------REGISTRAR QR-----------------------------------------
client.on('message', async (message) => {

    //normalizar entradas
    const lowerCaseMsg = message.body.trim().toLowerCase();

    if (lowerCaseMsg.startsWith('qr:')) {
        const qrCode = lowerCaseMsg.split(':')[1];
        console.error(message.from)
        const response = await fetch('http://localhost:8000/api/register-qr/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_code: qrCode, phone_number: message.from })
        });
        const result = await response.json();
        console.log(result)
        
        console.error(result.error);
        console.error(result.message);

        await message.reply(result.message || result.error);

        if (result.message_gift) console.log( result.message_gift) ;
        if (result.message_gift) console.log(typeof(result.message_gift)) ;

        
        if(result.message_gift !== '' && result.message !== undefined){
            console.log('gift usado')
            console.log(result.message_gift)
            await message.reply(result.message_gift)
        }

        if(result.referrer_number) console.log(await result.referrer_number);
        if(result.referrer_number > 0){

            message = 'Felicidades, has ganado 10 puntos de una compra de uno de tus referidos!!';
            await sendMessageToNumber(result.referrer_number, message);
        }
    }
});


//----------------------------MAIN MENU------------------------------------
client.on('message', async (message) => {
    //normalizar entradas
    
    const normalizeMessage = message.body.trim().toLowerCase();
    const phoneNumber = message.from.split('@')[0]; // Separa el número del dominio de WhatsApp
    const cleanedText = message.body.trim().replace(/\*/g, ""); // Reemplaza todos los asteriscos

    try {

    // Manejar el estado de espera
    // Verificar si el estado del usuario está definido
        if (userState[phoneNumber]) {
            // Verificar si la propiedad 'action' está definida
            if (userState[phoneNumber].action) {
                switch (userState[phoneNumber].action) {
                    case 'register':
                        console.log('Registrando usuario...');
                        await handleRegistrationName(message, phoneNumber, apiUrl);
                        break;

                    case 'add-Qr':
                        console.log('Añadiendo QR...');
                        await handleRegistrationQR(client, message, phoneNumber, message.body.trim(), apiUrl, userState);
                        break;

                    case 'addrefer':
                        console.log('Añadiendo referido...');
                        await handleAssociateRefer(client, message, phoneNumber, cleanedText, apiUrl,  userState);
                        break;
                    
                    case 'redeem':
                        console.log('Canjeando objeto...');
                        await handleRedeemItem(message, phoneNumber, cleanedText, apiUrl, userState);
                        break;

                    default:
                        console.log('Acción no reconocida.');
                }

                // Eliminar el estado del usuario después de procesar la acción
                delete userState[phoneNumber];
                return; // Salir después de manejar la acción
            }
        } else {
            // Manejar el caso en que userState[phoneNumber] no existe
            console.log(`No hay acción pendiente para el número ${phoneNumber}`);
        }



    switch (normalizeMessage) {
        case '/menu':
            await message.reply(`
    🎉✨ *¡Bienvenido al sistema de puntos de Previa!* ✨🎉
    
            🔢 *Opciones disponibles:*  
            1️⃣ *Registrar número*  
            2️⃣ *Consultar puntos acumulados* 
            3️⃣ *Registrar código QR*   

            4️⃣ *Ver mi codigo de referido*  
            5️⃣ *Ver mis referidos*  
            6️⃣ *Ver mis canjes*  
            7️⃣ *Canjear puntos por cupon de descuento*
            8️⃣ *Asociar referido* 
            9️⃣ *Ver items disponibles para canje*

    📝 *Elige una opción escribiendo el número correspondiente*  
            (Ejemplo: escribe '1' para registrar tu código QR).
    
    *¡Gracias por ser parte de *Previa Exprés* y disfruta acumulando puntos!* 🎁🌟
            `);

            console.log(userState);
            break;
    
        case '1':
            userState[phoneNumber] = {action : 'register'};
            
            console.log(userState);
            await message.reply('📑*Por favor, ingresa tu nombre para completar el registro*:');
            break;
    
        case '2':

            await message.reply('💰*Consulta de puntos en proceso...*💰');
            const myPoints = await getMyPoints(apiUrl, phoneNumber);
            console.log(myPoints);
            if(myPoints) await message.reply(myPoints);

            break;
        
        case '3':
            console.log('añadiendo qr');
            userState[phoneNumber] = {action : 'add-Qr'};
            await message.reply('*Recuerde que tambien puede usar un detector de qr para usar el codigo*➡️📷');
            await message.reply('📑*Por favor, ingresa el codigo detectado en el qr*:');
            
            break;
    
        case '4':
            await message.reply('👉🏼*Consultando mi codigo de referido...*👥');
            const myCode = await getMyReferCode(apiUrl, phoneNumber);
            console.log(myCode);
            if(myCode) await message.reply(myCode);

            break;
    
        case '5':
            await message.reply('🔐*Consulta de referidos en proceso...*🔑');
            const myRefferrals = await getMyRefferrals(apiUrl, phoneNumber);
            console.log(myRefferrals);
            if(myRefferrals) await message.reply(myRefferrals);

            
            break;
        
        case '6':
            await message.reply('🎁*Obteniendo lista de canjes/regalos...*🎁');
            
            const myRedeemedItems = await getMyRedeemedItems(apiUrl, phoneNumber);
            console.log(myRedeemedItems);
            if(myRedeemedItems) await message.reply(myRedeemedItems);
            break;

        case '7':
            await message.reply('🎁 *Canje de puntos en proceso...*🎟️');
            
            await message.reply('📑*Por favor, ingresa el ID del objeto que deseas canjear* (Ejemplo: "2")');
                userState[phoneNumber] = { action: 'redeem' };
                break;


        case '8':
            userState[phoneNumber] = {action : 'addrefer'};
            await message.reply('🎁 *Coloque el codigo de referido de un compañero: *🎟️');
            console.log(userState);
            break;
        case '9':
            await message.reply('🎁 *Consultando Items disponibles para canjear...*');
            const avaliableItems = await getAvailableItems(apiUrl);
            console.log(avaliableItems);
            if(avaliableItems) await message.reply(avaliableItems);
            break;
    
        /*default:
            await message.reply('⚠️ *Comando no reconocido.* Por favor, elige una opción válida del menú.');
            break;
        } */
        }

    
    }catch(error){
        console.error(error);
        await message.reply(`⛔*Lo sentimos, obtuvimos un error al procesar tu solicitud, intentelo otra vez.❌*`);
    }
    
});


// Inicialización del cliente con manejo de errores
try {
    client.initialize();
    console.log('Cliente inicializado correctamente.');
} catch(error){
    console.error('Error al inicializar el cliente:', error);
}