// ============================================
// CONFIGURAÇÕES — edite apenas aqui!
// ============================================
const CONFIG = {
  telefone:   '5551999255568',
  arquivoCSV: 'estoque.csv',
};

const MAPA_CORES = {
  'BR':  'Branco',  'PT':  'Preto',   'AZ':  'Azul',
  'AZM': 'Azul Marinho',              'VD':  'Verde',
  'DR':  'Dourado', 'VM':  'Vermelho','CZ':  'Cinza',
  'LJ':  'Laranja', 'PR':  'Roxo',    'GF':  'Grafite',
  'TN':  'Titânio', 'EE':  'Ed. Especial', 'FB': 'For Business',
  'N':   '',
};

const MAPA_IMAGENS = {
  'iPhone 17 Pro Max':  'imagens/iphone17promax.jpg',
  'iPhone 17 Pro':      'imagens/iphone17pro.jpg',
  'iPhone Air':         'imagens/iphoneair.jpg',
  'iPhone 17':          'imagens/iphone17.jpg',
  'iPhone 16e':         'imagens/iphone16e.jpg',
  'iPhone 15':          'imagens/iphone15.jpg',
  'iPad Pro':           'imagens/ipad-pro.jpg',
  'iPad Air':           'imagens/ipad-air.jpg',
  'iPad A16':           'imagens/ipad-a16.jpg',
  'Watch Series 11':    'imagens/apple-watch-s11.jpg',
  'Galaxy S25 Ultra':   'imagens/galaxy-s25-ultra.jpg',
  'Galaxy Z Flip 7':    'imagens/galaxy-z-flip7.jpg',
  'Galaxy S25 FE':      'imagens/galaxy-s25-fe.jpg',
  'Galaxy Tab S10 FE+': 'imagens/galaxy-tab-s10-fe-plus.jpg',
  'Galaxy Tab S10 FE':  'imagens/galaxy-tab-s10-fe.jpg',
  'Galaxy Watch 8':     'imagens/galaxy-watch-8.jpg',
  'Galaxy A36':         'imagens/galaxy-a36.jpg',
  'Galaxy A26':         'imagens/galaxy-a26.jpg',
  'Galaxy A17':         'imagens/galaxy-a17.jpg',
  'Galaxy A06':         'imagens/galaxy-a06.jpg',
  'Razr 60 Ultra':      'imagens/razr-60-ultra.jpg',
  'Edge 60 Fusion':     'imagens/edge-60-fusion.jpg',
  'G86':                'imagens/moto-g86.jpg',
  'G56':                'imagens/moto-g56.jpg',
  'G35':                'imagens/moto-g35.jpg',
  'G06':                'imagens/moto-g06.jpg',
  'G05':                'imagens/moto-g05.jpg',
};

function encontrarImagem(nome) {
  const chave = Object.keys(MAPA_IMAGENS).find(k => nome.includes(k));
  return chave ? MAPA_IMAGENS[chave] : null;
}

const SVG_WA = `
  <svg class="icone-wa" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;

// ============================================
// VARIÁVEIS DE ESTADO
// ============================================
let todosOsProdutos  = [];
let filtroMarcaAtivo = 'todos';
let filtroTipoAtivo  = 'todos';
let termoBusca       = '';
let ordenacaoAtiva   = 'nome';


// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  carregarCSV();
  configurarEventos();
});


// ============================================
// 1. CARREGAR O CSV
// ============================================
async function carregarCSV() {
  try {
    const resposta = await fetch(CONFIG.arquivoCSV);

    if (!resposta.ok) {
      throw new Error(`Arquivo "${CONFIG.arquivoCSV}" não encontrado na pasta.`);
    }

    const textoCSV = await resposta.text();
    todosOsProdutos = parsearCSV(textoCSV);

    criarBotoesFiltroPorMarca();
    criarBotoesFiltroPorTipo();
    renderizarCards();

  } catch (erro) {
    document.getElementById('grade-produtos').innerHTML =
      `<p style="color:red;padding:24px;grid-column:1/-1">
         ⚠️ Erro: ${erro.message}<br><br>
         Certifique-se de que o <strong>estoque.csv</strong> está na mesma pasta
         e que você está usando o <strong>Live Server</strong>.
       </p>`;
    document.getElementById('contador').textContent = '';
  }
}


// ============================================
// 2. PARSEAR O CSV
// ============================================
function parsearCSV(texto) {
  // CORREÇÃO: '\n' com uma barra só — quebra de linha real
  const linhas = texto.split('\n').filter(linha => linha.trim() !== '');

  const cabecalho = parsearLinhaCSV(linhas[0]);

  return linhas
    .slice(1)
    .map(linha => {
      const valores = parsearLinhaCSV(linha);
      const
