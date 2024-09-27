const { requestWrapperGET } = require('./apiClient');

async function getMyRefferrals(apiUrl, phoneNumber) {
    let endpoint = `${apiUrl}/api/get-refferrals/${phoneNumber}/`;
    let message = '';

    console.log(`${phoneNumber} ha consultado sus puntos`);

    try {
        const response = await requestWrapperGET(endpoint);

        if (!response.ok) console.log(`Error ${response.status}: ${response.statusText}`);

        const result = await response.json();
        console.log(`${result.referral_numbers} obtenido`);
        console.log(typeof(result.referral_numbers));
        
        if(result.error) {
            message = `*${result.error}*❌`;
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

module.exports = getMyRefferrals ;