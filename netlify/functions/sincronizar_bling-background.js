// Arquivo: netlify/functions/sincronizar_bling-background.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

async function refreshAccessToken(refresh_token) {
    console.log("Iniciando refresh de token...");
    const CLIENT_ID = process.env.BLING_CLIENT_ID;
    const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
    const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    const postBody = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });

    const tokenUrl = 'https://api.bling.com.br/Api/v3/oauth/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${base64Credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: postBody
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("Refresh falhou:", JSON.stringify(data));
        throw new Error(`Refresh falhou: ${JSON.stringify(data)}`);
    }

    data.expires_at = Date.now() + (data.expires_in * 1000);
    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN 
    });
    await store.setJSON("tokens", data);
    return data;
}

async function getAccessToken() {
    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });
    let tokens = await store.getJSON("tokens");

    if (!tokens || !tokens.access_token || Date.now() >= tokens.expires_at) {
        if (tokens && tokens.refresh_token) {
            tokens = await refreshAccessToken(tokens.refresh_token);
        } else {
            throw new Error("Token de acesso Bling não encontrado ou expirado. Autorize a aplicação primeiro.");
        }
    }
    return tokens.access_token;
}

function parseBlingPrice(priceString) {
    if (!priceString) return 0;
    
    // Converte para string, remove o separador de milhar (ponto) e substitui a vírgula por ponto decimal.
    const cleanString = String(priceString)
        .replace(/\./g, '') // Remove pontos de milhar
        .replace(/,/g, '.'); // Substitui a vírgula decimal por ponto

    const parsed = parseFloat(cleanString);

    // Retorna o valor ou 0 se for NaN
    return isNaN(parsed) ? 0 : parsed;
}


exports.handler = async () => {
    try {
        const accessToken = await getAccessToken();
        const storeProdutos = getStore({
            name: "produtos_bling",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_AUTH_TOKEN
        });

        // Limpa todos os produtos antigos antes de começar uma nova sincronização
        const listResult = await storeProdutos.list();
        for (const blob of listResult.blobs || []) {
            await storeProdutos.delete(blob.key);
        }
        console.log("Cache de produtos limpo. Iniciando nova sincronização.");


        const blingUrlBase = 'https://api.bling.com.br/Api/v3/produtos';
        let page = 1;
        let produtosSalvos = 0;
        let shouldContinue = true;

        while (shouldContinue) {
            const params = new URLSearchParams({
                pagina: page,
                limite: 100,
            });
            const url = `${blingUrlBase}?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const dados = await response.json();

            if (!response.ok) {
                console.error(`Erro Bling page ${page}:`, JSON.stringify(dados));
                throw new Error(`Erro ao buscar produtos Bling: ${dados.error.message || response.statusText}`);
            }

            if (!dados.data || dados.data.length === 0) {
                shouldContinue = false;
                break;
            }

            for (const produto of dados.data) {
                const idChave = produto.id.toString();
                const imagemUrl = produto.imagens?.[0]?.link || null;
                
                // --- LINHA DE PREÇO CORRIGIDA ---
                const precoNumerico = parseBlingPrice(produto.precoVenda); 

                try {
                    await storeProdutos.setJSON(idChave, {
                        nome: produto.nome,
                        preco: precoNumerico, // Usa o preço já limpo
                        estoque: parseInt(produto.estoqueAtual || 0),
                        imagemUrl: imagemUrl,
                        atualizado: new Date().toISOString()
                    });
                    produtosSalvos++;
                } catch (setError) {
                    console.error(`Erro ao salvar produto ID ${idChave}:`, setError.message, setError.stack);
                    // Continua
                }
                await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2s para evitar 401
            }

            console.log(`Página ${page} completa. Produtos salvos até agora: ${produtosSalvos}`);
            page++;
        }

        console.log(`Sincronização concluída! Total produtos: ${produtosSalvos}`);
        return { statusCode: 200, body: `Sincronização concluída. Produtos salvos: ${produtosSalvos}` };
    } catch (error) {
        console.error("Erro geral em sync:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
