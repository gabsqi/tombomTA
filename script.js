// ============================================
// CONFIGURAÇÕES
// ============================================
const CONFIG = {
  telefone: '5551999255568',
  arquivoCSV: 'estoque.csv',
};

const MAPA_IMAGENS = {
  'iPhone 17 Pro Max': 'imagens/iphone17promax.jpg',
  'iPhone 17 Pro': 'imagens/iphone17pro.jpg',
  'iPhone Air': 'imagens/iphoneair.jpg',
  'iPhone 17': 'imagens/iphone17.jpg',
  'Iphone 17e': 'imagens/iphone17e.jpg',
  'Iphone 16e': 'imagens/iphone16e.jpg',
  'Iphone 16': 'imagens/iphone16.jpg',
  'iPhone 15': 'imagens/iphone15.jpg',
  'Galaxy S25 Ultra': 'imagens/galaxy-s25-ultra.jpg',
  'Galaxy Z Flip 7': 'imagens/galaxy-z-flip7.jpg',
  'Galaxy S25 FE': 'imagens/galaxy-s25-fe.jpg',
  'Galaxy Tab S10 FE+': 'imagens/galaxy-tab-s10-fe-plus.jpg',
  'Galaxy Tab S10 FE': 'imagens/galaxy-tab-s10-fe.jpg',
  'Galaxy A36': 'imagens/galaxy-a36.jpg',
  'Galaxy A26': 'imagens/galaxy-a26.jpg',
  'Galaxy A17': 'imagens/galaxy-a17.jpg',
  'Galaxy A06': 'imagens/galaxy-a06.jpg',
  'Razr 60 Ultra': 'imagens/razr-60-ultra.jpg',
  'Edge 60 Fusion': 'imagens/edge-60-fusion.jpg',
  'Edge 70 Fusion': 'imagens/edge70fusion.jpg',
  'Edge 70 ': 'imagens/edge70.jpg',
  'G86': 'imagens/moto-g86.jpg',
  'G56': 'imagens/moto-g56.jpg',
  'G35': 'imagens/moto-g35.jpg',
  'G06': 'imagens/moto-g06.jpg',
  'G05': 'imagens/moto-g05.jpg',
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
let todosOsProdutos = [];
let filtroMarcaAtivo = 'todos';
let filtroTipoAtivo = 'todos';
let termoBusca = '';
let ordenacaoAtiva = 'nome';


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
      throw new Error(`Arquivo "${CONFIG.arquivoCSV}" não encontrado.`);
    }

    const textoCSV = await resposta.text();
    todosOsProdutos = parsearCSV(textoCSV);

    criarBotoesFiltroPorMarca();
    renderizarCards();

  } catch (erro) {
    document.getElementById('grade-produtos').innerHTML =
      `<p style="color:red;padding:24px;grid-column:1/-1">
         ⚠️ Erro: ${erro.message}<br><br>
         Verifique se o <strong>estoque.csv</strong> está na pasta
         e use o <strong>Live Server</strong> para testar.
       </p>`;
    document.getElementById('contador').textContent = '';
  }
}


// ============================================
// 2. PARSEAR O CSV
// Separador: ponto e vírgula (;)
// Filtra: apenas CD=DFW1, TIPO_MATERIAL=Aparelho, TIPO=Smartphone
// Dedup: remove linhas onde TIPO está vazio (linha duplicada sem tipo)
// ============================================
function parsearCSV(texto) {
  const linhas = texto.split('\n').filter(l => l.trim() !== '');

  // Cabeçalho separado por ;
  const cabecalho = linhas[0].split(';').map(c => c.trim().replace(/^"+|"+$/g, ''));

  const produtos = linhas
    .slice(1)
    .map(linha => {
      const valores = parsearLinhaCSV(linha, ';');
      const obj = {};
      cabecalho.forEach((col, i) => {
        obj[col] = (valores[i] || '').trim().replace(/^"+|"+$/g, '');
      });
      return obj;
    })
    .filter(obj => obj.TIPO && obj.TIPO.trim() !== '')
    .filter(obj => obj.TIPO === 'Smartphone')
    .filter(obj => obj.CD === 'DFW1')
    .filter(obj => obj.TIPO_MATERIAL === 'Aparelho')
    .filter(obj => parseInt(obj.SALDO, 10) > 0)
    .map(processarProduto)
    .filter(p => p !== null);
  return agruparPorModelo(produtos);  // ← adicione essa linha
}

function parsearLinhaCSV(linha, separador = ',') {
  const resultado = [];
  let campoAtual = '';
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        campoAtual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === separador && !dentroAspas) {
      resultado.push(campoAtual);
      campoAtual = '';
    } else {
      campoAtual += char;
    }
  }

  resultado.push(campoAtual);
  return resultado;
}


// ============================================
// 3. PROCESSAR PRODUTO
// ============================================
function processarProduto(linha) {
  if (!linha.MATERIAL || !linha.NOME_COMERCIAL) return null;

  const saldo = parseInt(linha.SALDO, 10) || 0;
  const nomeCompleto = limparNome(linha.NOME_COMERCIAL);

  // Colunas do novo arquivo
  const valor10x = parseFloat(linha.VALORATE10X) || 0;
  const valor24x = parseFloat(linha.VALORATE24X) || 0;

  // Parcelas calculadas (não vêm prontas no novo arquivo)
  const parc10x = valor10x > 0 ? valor10x / 10 : 0;
  const parc24x = valor24x > 0 ? valor24x / 24 : 0;

  return {
    material: linha.MATERIAL,
    nome: nomeCompleto,
    valor10x: valor10x,
    parc10x: parc10x,
    valor24x: valor24x,
    parc24x: parc24x,
    fabricante: linha.FABRICANTE || 'Outros',
    saldo: saldo,
    imagem: encontrarImagem(nomeCompleto),
    tipo: detectarTipo(linha.NOME_COMERCIAL),
    status: calcularStatus(saldo),
  };
}


// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function limparNome(nome) {
  return nome.replace(/"+/g, '').trim();
}

function detectarTipo(nome) {
  const n = nome.toLowerCase();
  if (n.includes('tablet') || n.includes('ipad')) return { label: 'Tablet', emoji: '📟' };
  if (n.includes('watch') || n.includes('relógio')) return { label: 'Wearable', emoji: '⌚' };
  return { label: 'Smartphone', emoji: '📱' };
}

function calcularStatus(saldo) {
  if (saldo === 0) return { classe: 'esgotado', texto: '❌ Esgotado' };
  if (saldo <= 3) return { classe: 'ultimos', texto: `⚡ Últimas ${saldo} unidades!` };
  if (saldo <= 10) return { classe: 'poucos', texto: `⚠️ Apenas ${saldo} unidades` };
  return { classe: 'disponivel', texto: `✅ ${saldo} unidades` };
}

function agruparPorModelo(produtos) {
  const mapa = {};

  produtos.forEach(produto => {
    const chave = produto.nome;

    if (!mapa[chave] || produto.saldo > mapa[chave].saldo) {
      mapa[chave] = produto;
    }
  });

  return Object.values(mapa);
}

// ============================================
// 4. CRIAR BOTÕES DE FILTRO
// ============================================
function criarBotoesFiltroPorMarca() {
  const marcas = ['todos', ...new Set(todosOsProdutos.map(p => p.fabricante).sort())];
  const container = document.getElementById('filtros-marca');

  marcas.forEach(marca => {
    const btn = document.createElement('button');
    btn.className = 'filtro-btn' + (marca === 'todos' ? ' ativo' : '');
    btn.textContent = marca === 'todos' ? '🏷️ Todas as marcas' : marca;
    btn.dataset.valor = marca;
    btn.onclick = () => alterarFiltroMarca(marca);
    container.appendChild(btn);
  });
}



// ============================================
// 5. FILTRAR, ORDENAR E RENDERIZAR
// ============================================
function renderizarCards() {
  const filtrados = filtrarEOrdenar();
  const grade = document.getElementById('grade-produtos');
  const semResult = document.getElementById('sem-resultados');
  const contador = document.getElementById('contador');

  grade.innerHTML = '';

  if (filtrados.length === 0) {
    semResult.classList.remove('oculto');
    contador.innerHTML = 'Nenhum produto encontrado.';
    return;
  }

  semResult.classList.add('oculto');
  contador.innerHTML = `Mostrando <strong>${filtrados.length}</strong> produto(s)`;

  filtrados.forEach(produto => {
    grade.insertAdjacentHTML('beforeend', criarCardHTML(produto));
  });
}

function filtrarEOrdenar() {
  let resultado = [...todosOsProdutos];

  if (filtroMarcaAtivo !== 'todos') {
    resultado = resultado.filter(p => p.fabricante === filtroMarcaAtivo);
  }
  if (filtroTipoAtivo !== 'todos') {
    resultado = resultado.filter(p => p.tipo.label === filtroTipoAtivo);
  }
  if (termoBusca.length > 0) {
    const busca = termoBusca.toLowerCase();
    resultado = resultado.filter(p =>
      p.nome.toLowerCase().includes(busca) ||
      p.fabricante.toLowerCase().includes(busca)
    );
  }

  resultado.sort((a, b) => {
    if (ordenacaoAtiva === 'menor-preco') return a.valor10x - b.valor10x;
    if (ordenacaoAtiva === 'maior-preco') return b.valor10x - a.valor10x;
    if (ordenacaoAtiva === 'mais-estoque') return b.saldo - a.saldo;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return resultado;
}


// ============================================
// 6. CRIAR HTML DO CARD
// ============================================
function criarCardHTML(produto) {
  const marcaClasse = produto.fabricante.toLowerCase();
  const esgotado = produto.saldo === 0;

  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no *${produto.nome}*.\nPoderia me passar mais informações? 😊`
  );
  const linkWA = `https://wa.me/${CONFIG.telefone}?text=${mensagem}`;

  const fmt = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return `
    <article class="card ${esgotado ? 'card--esgotado' : ''}">

    <div class="card__imagem">
  ${produto.imagem
      ? `<img src="${produto.imagem}" alt="${produto.nome}" class="card__foto" />`
      : ''}
    </div>

      <div class="card__corpo">

        <div class="card__cabecalho-info">
          <span class="card__marca card__marca--${marcaClasse}">${produto.fabricante}</span>
        </div>

        <h2 class="card__nome">${produto.nome}</h2>

        <span class="card__estoque card__estoque--${produto.status.classe}">
          <span class="card__ponto"></span>
          ${produto.status.texto}
        </span>

        <div class="card__precos">
          <div class="card__preco-linha">
            <span class="card__preco-label">10× sem juros</span>
            <div class="card__preco-valores">
              <span class="card__preco-parcela">${fmt(produto.parc10x)}/mês</span>
              <span class="card__preco-total">Total: ${fmt(produto.valor10x)}</span>
            </div>
          </div>
          <div class="card__preco-linha">
            <span class="card__preco-label">24×</span>
            <div class="card__preco-valores">
              <span class="card__preco-parcela">${fmt(produto.parc24x)}/mês</span>
              <span class="card__preco-total">Total: ${fmt(produto.valor24x)}</span>
            </div>
          </div>
        </div>

        ${esgotado
      ? `<button class="card__botao-wa" disabled>Produto Esgotado</button>`
      : `<a href="${linkWA}" target="_blank" class="card__botao-wa">
               ${SVG_WA} Quero esse!
             </a>`}

      </div>
    </article>`;
}


// ============================================
// 7. EVENTOS
// ============================================
function configurarEventos() {
  document.getElementById('campo-busca').addEventListener('input', function () {
    termoBusca = this.value.trim();
    renderizarCards();
  });

  document.getElementById('select-ordenacao').addEventListener('change', function () {
    ordenacaoAtiva = this.value;
    renderizarCards();
  });
}

function alterarFiltroMarca(marca) {
  filtroMarcaAtivo = marca;
  atualizarBotaoAtivo('filtros-marca', marca);
  renderizarCards();
}

function alterarFiltroTipo(tipo) {
  filtroTipoAtivo = tipo;
  atualizarBotaoAtivo('filtros-tipo', tipo);
  renderizarCards();
}

function atualizarBotaoAtivo(idContainer, valorAtivo) {
  const container = document.getElementById(idContainer);
  container.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.valor === valorAtivo);
  });
}

function limparFiltros() {
  filtroMarcaAtivo = 'todos';
  filtroTipoAtivo = 'todos';
  termoBusca = '';
  ordenacaoAtiva = 'nome';
  document.getElementById('campo-busca').value = '';
  document.getElementById('select-ordenacao').value = 'nome';
  atualizarBotaoAtivo('filtros-marca', 'todos');
  atualizarBotaoAtivo('filtros-tipo', 'todos');
  renderizarCards();
}
