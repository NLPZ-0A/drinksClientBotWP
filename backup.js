const fs = require('fs');
const fetch = require('node-fetch');
const { prependListener } = require('process');
const qrcode = require('qrcode-terminal');
const { CLIENT_RENEG_LIMIT } = require('tls');
const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');

const apiUrl = 'http://127.0.0.1:8000';
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
let userState = {};


//--------------------------OBTENER ayuda ------------------------------------------------
client.on('message', async (message) => {
    
    //normalizar entradas
    const lowerCaseMsg = message.body.trim().toLowerCase();

    if (lowerCaseMsg  === '/menuAyuda') {
        message.reply(`
        Bienvenido al sistema de puntos previa.
        1. Registrar código QR 
        2. Consultar puntos acumulados
        3. Ver mis referidos
        4. Canjear puntos
        Elige una opción (por ejemplo, escribe '1' para registrar código QR).
        `);
    }
});

//--------------------------------OBTENER PUNTOS-------------------------------
client.on('message', async (message) => {
    //normalizar entradas
    const lowerCaseMsg = message.body.trim().toLowerCase();
    if (lowerCaseMsg === '/mispuntos') {
        // Extraer el número de teléfono del remitente
        const phoneNumber = message.from.split('@')[0]; // Separa el número del dominio de WhatsApp

        try {
            // Enviar la solicitud GET al backend de Django con el número de teléfono
            const response = await fetch(`http://localhost:8000/api/points/${phoneNumber}/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // Parsear la respuesta JSON
            const result = await response.json();

            
            // Revisar si hay algún error
            if (result.error) {
                await message.reply(`Error: ${result.error}`);
            } else {
                await message.reply(`Tienes ${result.points} puntos.`);
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            // Responder en caso de error en la solicitud
            if(result.error){
                await message.reply(result.error);
            }else{
                await message.reply("Ha ocurrido un error!");
            }
            
        }
    }
});

//--------------------------------OBTENER CODIGO REFERIDO-------------------------------
client.on('message', async (message) => {
    const lowerCaseMsg = message.body.trim().toLowerCase();
    if (lowerCaseMsg === '/codigoreferido') {
        // Extraer el número de teléfono del remitente
        const phoneNumber = message.from.split('@')[0]; // Separa el número del dominio de WhatsApp

        try {
            // Enviar la solicitud GET al backend de Django con el número de teléfono
            const response = await fetch(`http://localhost:8000/api/code_refer/${phoneNumber}/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // Parsear la respuesta JSON
            const result = await response.json();

            
            // Revisar si hay algún error
            if (result.error) {
                await message.reply(`Error: ${result.error}`);
            } else {
                await message.reply(`tu codigo de referido es  ${result.code} `);
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            // Responder en caso de error en la solicitud
            if(result.error){
                await message.reply(result.error);
            }else{
                await message.reply("Ha ocurrido un error!");
            }
            
        }
    }
});

//------------------------------------REGISTRAR NÚMERO------------------------------------------
client.on('message', async (message) => {

    //normalizar entradas
    const lowerCaseMsg = message.body.trim().toLowerCase();

    if (lowerCaseMsg.startsWith('/registrar:')) {
        // Extraer el nombre del mensaje
        const name = lowerCaseMsg.split(':')[1].trim();

        // Asegurarse de que el nombre no esté vacío
        if (!name) {
            message_error = 'Por favor, ingresa un nombre válido para crear tu perfil.Recuerde que para registrar registrar:"sunombre" sin las comillas.'
            await message.reply(message_error);
            return;
        }

        // Obtener el número de teléfono del remitente (message.from)
        const phoneNumber = message.from;

        try {
            // Enviar la solicitud POST al backend de Django
            const response = await fetch('http://localhost:8000/api/create-profile/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    phone_number: phoneNumber
                })
            });

            // Parsear la respuesta JSON
            const result = await response.json();

            // Responder al usuario en WhatsApp con el mensaje o error
            if (result.error) {
                await message.reply(`Error: ${result.error}`);
            } else {
                await message.reply(`Perfil creado exitosamente. ${result.message}`);
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            await message.reply('Ocurrió un error al crear tu perfil. Inténtalo más tarde.');
        }
    }
});

//------------------------------------ASOCIAR REFERIDO------------------------------------------
client.on('message', async (message) => { 

    //normalizar entradas
    const lowerCaseMsg = message.body.trim().toLowerCase();

    if (lowerCaseMsg.startsWith('referido:')) {
        // Extraer el código de referido del mensaje
        const refer = lowerCaseMsg.split(':')[1].trim();
        console.error(refer)
        try {
            // Enviar la solicitud POST al backend de Django
            const response = await fetch('http://localhost:8000/api/add-reffer/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    refer: refer, 
                    phone_number: message.from // Aquí envías el número de teléfono del mensaje
                })
            });

            // Parsear la respuesta JSON
            const result = await response.json();

            
            // Mostrar los resultados en la consola
            if (result.error) {
                console.error(`Error: ${result.error}`);
            } else {
                console.log(`Mensaje: ${result.message}`);
            }

            // Responder al usuario en WhatsApp con el mensaje o error

            
            await message.reply(result.message || result.error);
            await  sendMessageToNumber(result.referrer, `has agregado a +${result.from_number} como referido`);

        } catch (error) {
            console.error('Error en la solicitud:', error);
            // Responder en caso de error en la solicitud
            await message.reply('Ocurrió un error al registrar el referido.');
        }
    }
});

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
                        await handleRegistrationQR(message, phoneNumber, message.body.trim());
                        break;

                    case 'addrefer':
                        console.log('Añadiendo referido...');
                        await handleAssociateRefer(message, phoneNumber, cleanedText);
                        break;
                    
                    case 'redeem':
                        console.log('Canjeando objeto...');
                        await handleRedeemItem(message, phoneNumber, cleanedText, );
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

//-------------------------------OBTENER PUNTOS-------------------------------------------
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

//-----------------------------OBTENER MIS REFERIDOS----------------------------------------
async function getMyRefferrals(apiUrl, phoneNumber) {
    let endpoint = `${apiUrl}/api/get-refferrals/${phoneNumber}/`;
    let message = '';

    console.log(`${phoneNumber} ha consultado sus puntos`);

    try {
        const response = await requestWrapperGET(endpoint);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`${result.referral_numbers} obtenido`);
        console.log(typeof(result.referral_numbers));
        
        if(result.error) {
            message = `*Error: ${result.error}*❌`;
        } else {
            
            message = "*Has referido a los siguientes números:*🗒️ \n";

            // Recorrer la lista y añadir cada número al mensaje
            result.referral_numbers.forEach((phone, index) => {
                message += `*${index + 1}. +${phone}*📞\n `;
            });

        }

        console.log(message)


    }catch(error) {
        console.error('Error en la solicitud:', error);
        message = "❌*Ha ocurrido un error en la solicitud. Por favor, intenta nuevamente.*❌"; 
    }

    return message;

}

//------------------------------OBTENER CODIGO REFERIDO------------------------------------
async function getMyReferCode(apiUrl, phoneNumber){
    let endpoint = `${apiUrl}/api/code-refer/${phoneNumber}/`;
    let message = '';

    try {
        const response = await requestWrapperGET(endpoint);
        const result = await response.json();


        if (result.error) {
           message = `Error: ${result.error}❌`;
        } else {
            message = `🔐 Tu codigo de referido es: *${result.code}* `;
        }

    }catch(error) {
        console.error('Error en la solicitud:', error);
        
            message="*Ha ocurrido un error en el procesamiento de la solicitud!*⚠️";
    }
    
    return message;
}

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

//------------------------------------OBTENER MIS ITEMS--------------------------------------
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

//--------------------------------REGISTRAR PERFIL-----------------------------------------------
async function registerProfile(apiUrl, obj) {
    let endpoint = `${apiUrl}/api/create-profile/`;
    message = '';

    try {
        const response = await requestWrapperPOST(endpoint, obj);
        const result = await response.json();

        // Responder al usuario en WhatsApp con el mensaje o error
        if (result.error) {
           message = `Error: ${result.error}`;
        } else {
           message = `Perfil creado exitosamente. ${result.message}`;
        }

    } catch (error) {
        console.error('Error en la solicitud:', error);
        message = 'Ocurrió un error al crear tu perfil. Inténtalo más tarde.';
    }

    return message;
}

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
    
// Función para manejar la espera de un nombre de usuario
async function handleRegistrationName(message, phoneNumber){
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

async function handleRegistrationQR(message, phoneNumber, qrCode_){

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

            await sendMessageToNumber(result.referrer_number, result.message_refer);
        }
    }
        
        // Finalizar el registro y eliminar el estado pendiente
    delete userState[phoneNumber].action;

    console.log(userState);
    console.log("salimos...");
    
    return
}

async function handleAssociateRefer(message, phoneNumber, refer){
    
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
                await sendMessageToNumber(result.referrer, `*has agregado a +${result.from_number} como referido*🤜🏽​🤛🏽​`);
            }
            
        }

        delete userState[phoneNumber].action;

    } catch (error) {
        console.error('Error en la solicitud:', error);
        // Responder en caso de error en la solicitud
        await message.reply('*Ocurrió un error al registrar el referido*❌.');
    }
}

async function handleRedeemItem(message, phoneNumber, itemId) {


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

// Función para enviar un mensaje a un número de teléfono
async function sendMessageToNumber(phoneNumber, message) {
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

async function requestWrapperPOST(apiUrl, objectJson) {

    try{
        console.log(JSON.stringify(objectJson));

        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(objectJson)
                        });

        return response;
    }catch(error){
        console.error(error)
        return error;
    }
}

async function requestWrapperGET(apiUrl) {
    try{
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        return response;
    }catch(error){
        console.error(error)
        return error;
    }
}

// Inicialización del cliente con manejo de errores
try {
    client.initialize();
    console.log('Cliente inicializado correctamente.');
} catch(error){
    console.error('Error al inicializar el cliente:', error);
}