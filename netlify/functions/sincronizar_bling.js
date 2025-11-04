// ...
const sku = produto.codigo; 

// [IMPORTANTE] Ignorar produtos sem SKU. Se não tiver SKU, NUNCA é sincronizado.
if (!sku) {
    console.log(`[AVISO] Produto ID ${produto.id} não possui SKU e foi ignorado.`);
    continue; // Pula para o próximo produto
}
// ...
await store.setJSON(sku, {
// ...
