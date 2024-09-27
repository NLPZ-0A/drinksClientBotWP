const { requestWrapperPOST } = require('./apiClient');

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

module.exports = registerProfile;