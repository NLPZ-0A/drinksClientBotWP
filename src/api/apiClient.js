const fetch = require('node-fetch');

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


module.exports = {
    requestWrapperPOST,
    requestWrapperGET,
};