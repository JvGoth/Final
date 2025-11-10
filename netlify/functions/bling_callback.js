// FORÇAR O USO DE REQUIRE para node-fetch e querystring
const querystring = require("querystring");
// 💡 NOVO: Importe explicitamente o Buffer para evitar o erro "Buffer is not defined"
const { Buffer } = require("buffer");

// --- Variáveis de Ambiente Necessárias (Configure no Netlify!) ---
// 1. O Client ID do seu Aplicativo Bling
const CLIENT_ID = process.env.BLING_CLIENT_ID; 
// 2. O Client Secret do seu Aplicativo Bling
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
// 3. A URL de Retorno EXATA que você cadastrou no Bling (MUITO IMPORTANTE!)
const REDIRECT_URI = 'https://miaupresentes.netlify.app/.netlify/functions/bling_callback';

const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
const base64Credentials = Buffer.from(credentials).toString('base64');

exports.handler = async (event) => {
    // 1. Recebe o 'code' (código de autorização) que o Bling envia
    const code = event.queryStringParameters.code;

    if (!code) {
        return {
            statusCode: 400,
            body: "Erro: Código de autorização 'code' não encontrado na URL."
        };
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return {
            statusCode: 500,
            body: "Erro: Variáveis CLIENT_ID ou CLIENT_SECRET não configuradas no Netlify."
        };
    }
    
    // 2. Monta o corpo da requisição POST para trocar o código pelo token
    const postBody = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        // CLIENT_ID e CLIENT_SECRET REMOVIDOS daqui!
    });

    const tokenUrl = 'https://bling.com.br/Api/v3/oauth/token';

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                // **PASSO 3: ADICIONAR O CABEÇALHO AUTHORIZATION: BASIC**
                'Authorization': `Basic ${base64Credentials}`, 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: postBody,
        });

        const data = await response.json();
        };
    }
};
