// FORÇAR O USO DE REQUIRE para node-fetch e querystring
const querystring = require("querystring"); 

// --- Variáveis de Ambiente Necessárias (Configure no Netlify!) ---
// 1. O Client ID do seu Aplicativo Bling
const CLIENT_ID = process.env.BLING_CLIENT_ID; 
// 2. O Client Secret do seu Aplicativo Bling
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
// 3. A URL de Retorno EXATA que você cadastrou no Bling (MUITO IMPORTANTE!)
const REDIRECT_URI = 'https://miaupresentes.netlify.app/.netlify/functions/bling_callback'; 

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
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    const tokenUrl = 'https://bling.com.br/Api/v3/oauth/token';

    try {
        // 3. Envia a requisição para obter os tokens
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: postBody,
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            // 4. SUCESSO: Retorna os tokens para o usuário
            // AVISO: NÃO MANTENHA ESTA FUNÇÃO NO AR APÓS OBTER SEUS TOKENS!
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/html' },
                body: `
                    <h1>SUCESSO! TOKENS OBTIDOS</h1>
                    <p>O Bling autorizou sua aplicação. Você precisa **COPIAR E SALVAR** os tokens abaixo como variáveis de ambiente no Netlify.</p>
                    
                    <h2 style="color: green;">PASSO 1: Access Token (Uso Imediato)</h2>
                    <textarea rows="4" cols="80" onclick="this.select();">${data.access_token}</textarea>
                    
                    <h2 style="color: orange;">PASSO 2: Refresh Token (Para renovação automática)</h2>
                    <textarea rows="4" cols="80" onclick="this.select();">${data.refresh_token}</textarea>

                    <p style="color: red;">APÓS SALVAR OS TOKENS NO NETLIFY, REMOVA ESSA FUNÇÃO DO AR!</p>
                    <p>Agora você deve usá-los no seu código *sincronizar_bling.js*.</p>
                `
            };
        } else {
            // 5. ERRO: Bling retornou um erro (ex: Client ID/Secret errado)
            return {
                statusCode: 500,
                body: `Falha na Troca de Código (Resposta Bling): ${JSON.stringify(data, null, 2)}`
            };
        }

    } catch (error) {
        // 6. ERRO DE REDE: Ocorreu um erro na requisição (Network Error)
        return {
            statusCode: 500,
            body: `Erro fatal de rede: ${error.message}`
        };
    }
};
