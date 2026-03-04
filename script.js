// ============================================
// CONFIGURAÇÕES — edite apenas aqui!
// ============================================
const CONFIG = {
  telefone:    '5551999255568',   // seu número no formato internacional
  arquivoCSV:  'estoque.csv',     // nome do arquivo CSV na pasta
};

// Tradução dos códigos de cor que aparecem no campo MATERIAL
const MAPA_CORES = {
  'BR':  'Branco',
  'PT':  'Preto',
  'AZ':  'Azul',
  'AZM': 'Azul Marinho',
  'VD':  'Verde',
  'DR':  'Dourado',
  'VM':  'Vermelho',
  'CZ':  'Cinza',
  'LJ':  'Laranja',
  'PR':  'Roxo',
  'GF':  'Grafite',
  'TN':  'Titânio',
  'EE':  'Ed. Especial',
  'FB':  'For Business',
  'N':   '',   // sufixo "Nacional" — não exibe
};

// SVG do WhatsApp reutilizado dentro dos cards
const SVG_WA = `
  <svg class="icone-wa" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;


// ============================================
// VARIÁVEIS DE ESTADO
// Guardam o estado atual de todos os filtros
// ============================================
let todosOsProdutos  = [];       // array com todos os produtos do CSV
let filtroMarcaAtivo = 'todos';
let filtroTipoAtivo  = 'todos';
let termoBusca       = '';
let ordenacaoAtiva   = 'nome';


// ============================================
// INICIALIZAÇÃO
// Roda automaticamente quando o HTML carrega
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  carregarCSV();
  configurarEventos();
});


// ============================================
// 1. CARREGAR O CSV
//
// fetch() faz uma requisição ao arquivo .csv
// async/await espera a resposta antes de continuar
// ============================================
async function carregarCSV() {
  try {
    const resposta = await fetch(CONFIG.arquivoCSV);

    if (!resposta.ok) {
      throw new Error(`Arquivo "${CONFIG.arquivoCSV}" não encontrado na pasta.`);
    }

    const textoCSV = await resposta.text();   // lê o conteúdo como texto simples
    todosOsProdutos = parsearCSV(textoCSV);   // transforma em array de objetos

    criarBotoesFiltroPorMarca();
    criarBotoesFiltroPorTipo();
    renderizarCards();

  } catch (erro) {
    document.getElementById('grade-produtos').innerHTML =
      `<p style="color:red;padding:24px;grid-column:1/-1">
         ⚠️ Erro: ${erro.message}<br><br>
         Certifique-se de que o arquivo <strong>estoque.csv</strong> está na mesma
         pasta que o index.html e que você está usando um servidor local (Live Server).
       </p>`;
    document.getElementById('contador').textContent = '';
  }
}


// ============================================
// 2. PARSEAR O CSV
//
// Recebe o texto bruto do CSV e devolve um
// array de objetos JavaScript. Cada linha do
// CSV vira um objeto com as colunas como chaves.
// ============================================
function parsearCSV(texto) {
  const linhas = texto.split('\n').filter(linha => linha.trim() !== '');

  // Primeira linha = cabeçalho (MATERIAL, NOME_COMERCIAL, etc.)
  const cabecalho = parsearLinhaCSV(linhas[0]);

  // Demais linhas = dados
  return linhas
    .slice(1)
    .map(linha => {
      const valores = parsearLinhaCSV(linha);
      const obj = {};
      cabecalho.forEach((coluna, i) => {
        // trim() remove espaços, replace remove aspas extras do CSV
        obj[coluna.trim()] = (valores[i] || '').trim().replace(/^"+|"+$/g, '');
      });
      return obj;
    })
    .map(processarProduto)
    .filter(p => p !== null);  // remove linhas inválidas
}

// Parseia uma linha respeitando campos entre aspas
// (necessário porque alguns nomes têm vírgulas)
function parsearLinhaCSV(linha) {
  const resultado = [];
  let campoAtual   = '';
  let dentroAspas  = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        campoAtual += '"';
        i++;                          // pula a aspa duplicada
      } else {
        dentroAspas = !dentroAspas;   // abre ou fecha campo com aspas
      }
    } else if (char === ',' && !dentroAspas) {
      resultado.push(campoAtual);
      campoAtual = '';
    } else {
      campoAtual += char;
    }
  }

  resultado.push(campoAtual);  // último campo
  return resultado;
}


// ============================================
// 3. PROCESSAR PRODUTO
//
// Adiciona campos calculados a cada linha do CSV
// e devolve um objeto limpo para usar no card
// ============================================
function processarProduto(linha) {
  if (!linha.MATERIAL || !linha.NOME_COMERCIAL) return null;

  const saldo = parseInt(linha.SALDO, 10) || 0;

  return {
    material:      linha.MATERIAL,
    nome:          limparNome(linha.NOME_COMERCIAL),
    valor10x:      parseFloat(linha.VALOR_10x) || 0,
    parc10x:       parseFloat(linha.PARC_10X)  || 0,
    valor24x:      parseFloat(linha.VALOR_24X) || 0,
    parc24x:       parseFloat(linha.PARC_24X)  || 0,
    fabricante:    linha.FABRICANTE || 'Outros',
    saldo:         saldo,
    tipo:          detectarTipo(linha.NOME_COMERCIAL),
    status:        calcularStatus(saldo),
  };
}

// Remove aspas e espaços extras do nome
function limparNome(nome) {
  return nome.replace(/"+/g, '').trim();
}

// Extrai a cor a partir do código de material
// Ignora partes com "/" (ex: PPB/P291/14)
function extrairCor(material) {
  const partes     = material.split(' ').filter(p => !p.includes('/'));
  const ultimaParte = partes[partes.length - 1].toUpperCase();
  const cor         = MAPA_CORES[ultimaParte];
  return (cor !== undefined) ? cor : ultimaParte;
}

// Detecta o tipo (Smartphone, Tablet ou Wearable)
// pelo texto do NOME_COMERCIAL
function detectarTipo(nome) {
  const n = nome.toLowerCase();
  if (n.includes('tablet') || n.includes('ipad'))     return { label: 'Tablet',     emoji: '📟' };
  if (n.includes('watch')  || n.includes('relógio'))  return { label: 'Wearable',   emoji: '⌚' };
  return                                                      { label: 'Smartphone', emoji: '📱' };
}

// Define o status de estoque com base na quantidade
function calcularStatus(saldo) {
  if (saldo === 0)  return { classe: 'esgotado',   texto: '❌ Esgotado' };
  if (saldo <= 3)   return { classe: 'ultimos',    texto: `⚡ Últimas ${saldo} unidades!` };
  if (saldo <= 10)  return { classe: 'poucos',     texto: `⚠️ Apenas ${saldo} unidades` };
  return                   { classe: 'disponivel', texto: `✅ ${saldo} unidades` };
}


// ============================================
// 4. CRIAR BOTÕES DE FILTRO DINAMICAMENTE
//
// Os botões são gerados com base nos dados reais
// do CSV — não precisam ser escritos no HTML
// ============================================
function criarBotoesFiltroPorMarca() {
  // Set() garante valores únicos; sort() ordena
  const marcas = ['todos', ...new Set(todosOsProdutos.map(p => p.fabricante).sort())];

  const container = document.getElementById('filtros-marca');
  marcas.forEach(marca => {
    const btn = document.createElement('button');
    btn.className   = 'filtro-btn' + (marca === 'todos' ? ' ativo' : '');
    btn.textContent = marca === 'todos' ? '🏷️ Todas as marcas' : marca;
    btn.dataset.valor = marca;
    btn.onclick = () => alterarFiltroMarca(marca);
    container.appendChild(btn);
  });
}

function criarBotoesFiltroPorTipo() {
  const tipos = ['todos', 'Smartphone', 'Tablet', 'Wearable'];
  const container = document.getElementById('filtros-tipo');

  tipos.forEach(tipo => {
    const btn = document.createElement('button');
    btn.className   = 'filtro-btn' + (tipo === 'todos' ? ' ativo' : '');
    btn.textContent = tipo === 'todos' ? '📦 Todos' : tipo;
    btn.dataset.valor = tipo;
    btn.onclick = () => alterarFiltroTipo(tipo);
    container.appendChild(btn);
  });
}


// ============================================
// 5. FILTRAR, ORDENAR E RENDERIZAR OS CARDS
// ============================================

// Renderiza os cards aplicando os filtros ativos
function renderizarCards() {
  const filtrados = filtrarEOrdenar();
  const grade     = document.getElementById('grade-produtos');
  const semResult = document.getElementById('sem-resultados');
  const contador  = document.getElementById('contador');

  grade.innerHTML = '';  // limpa os cards anteriores

  if (filtrados.length === 0) {
    semResult.classList.remove('oculto');
    contador.innerHTML = 'Nenhum produto encontrado.';
    return;
  }

  semResult.classList.add('oculto');
  contador.innerHTML = `Mostrando <strong>${filtrados.length}</strong> produto(s)`;

  // Cria e insere cada card no HTML
  filtrados.forEach(produto => {
    grade.insertAdjacentHTML('beforeend', criarCardHTML(produto));
  });
}

// Aplica filtros de marca, tipo, busca e ordenação
function filtrarEOrdenar() {
  let resultado = [...todosOsProdutos];  // cópia — não altera o original

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

  // Ordenação com sort() e localeCompare para acentos
  resultado.sort((a, b) => {
    if (ordenacaoAtiva === 'menor-preco')  return a.valor10x - b.valor10x;
    if (ordenacaoAtiva === 'maior-preco')  return b.valor10x - a.valor10x;
    if (ordenacaoAtiva === 'mais-estoque') return b.saldo - a.saldo;
    return a.nome.localeCompare(b.nome, 'pt-BR');  // padrão: A → Z
  });

  return resultado;
}


// ============================================
// 6. CRIAR O HTML DE UM CARD
//
// Template literal (``) monta o HTML do card
// usando os dados do objeto produto
// ============================================
function criarCardHTML(produto) {
  const marcaClasse = produto.fabricante.toLowerCase();
  const esgotado    = produto.saldo === 0;

  // encodeURIComponent transforma o texto em formato seguro para URL
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no *${produto.nome}*` +
    (produto.cor ? ` (Cor: ${produto.cor})` : '') +
    `.\nPoderia me passar mais informações? 😊`
  );
  const linkWA = `https://wa.me/${CONFIG.telefone}?text=${mensagem}`;

  // Formata número em Real Brasileiro: 1234.5 → R$ 1.234,50
  const fmt = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return `
    <article class="card ${esgotado ? 'card--esgotado' : ''}">

      <div class="card__imagem">${produto.tipo.emoji}</div>

      <div class="card__corpo">

        <div class="card__cabecalho-info">
          <span class="card__marca card__marca--${marcaClasse}">${produto.fabricante}</span>
          ${produto.cor ? `<span class="card__cor">${produto.cor}</span>` : ''}
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
             </a>`
        }

      </div>
    </article>`;
}


// ============================================
// 7. EVENTOS — escuta ações do usuário
// ============================================
function configurarEventos() {

  // Busca em tempo real enquanto digita
  document.getElementById('campo-busca').addEventListener('input', function () {
    termoBusca = this.value.trim();
    renderizarCards();
  });

  // Mudança na ordenação
  document.getElementById('select-ordenacao').addEventListener('change', function () {
    ordenacaoAtiva = this.value;
    renderizarCards();
  });
}

// Troca o filtro de marca ativo
function alterarFiltroMarca(marca) {
  filtroMarcaAtivo = marca;
  atualizarBotaoAtivo('filtros-marca', marca);
  renderizarCards();
}

// Troca o filtro de tipo ativo
function alterarFiltroTipo(tipo) {
  filtroTipoAtivo = tipo;
  atualizarBotaoAtivo('filtros-tipo', tipo);
  renderizarCards();
}

// Marca visualmente o botão ativo e desativa os outros
function atualizarBotaoAtivo(idContainer, valorAtivo) {
  const container = document.getElementById(idContainer);
  container.querySelectorAll('.filtro-btn').forEach(btn => {
    // toggle adiciona 'ativo' se for true, remove se for false
    btn.classList.toggle('ativo', btn.dataset.valor === valorAtivo);
  });
}

// Chamado pelo botão "Limpar filtros" no HTML (onclick)
function limparFiltros() {
  filtroMarcaAtivo = 'todos';
  filtroTipoAtivo  = 'todos';
  termoBusca       = '';
  ordenacaoAtiva   = 'nome';
  document.getElementById('campo-busca').value         = '';
  document.getElementById('select-ordenacao').value    = 'nome';
  atualizarBotaoAtivo('filtros-marca', 'todos');
  atualizarBotaoAtivo('filtros-tipo',  'todos');
  renderizarCards();
}
