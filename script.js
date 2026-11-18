const MODULOS = [
  {
    id: 'Demandas',
    nome: 'Demandas',
    cor: '#7BA0E4',
    corSuave: 'rgba(123, 160, 228, 0.10)',
    posicao: 'topo',
    tarefasBase: [],
  },
  {
    id: 'Deus',
    nome: 'Deus',
    epíteto: 'Eixo',
    cor: '#B9A3E6',
    corSuave: 'rgba(185, 163, 230, 0.10)',
    posicao: 'esquerda',
    tarefasBase: [
      'Oração manhã',
      'Oração tarde',
      'Oração noite',
      'Oração sonhos',
      'Pregação',
      '3 Hinos da Harpa',
      'Leitura bíblica',
      'Aula da EBD',
      'Preparar slides',
    ],
  },
  {
    id: 'fisico',
    nome: 'Físico',
    cor: '#8FCB9B',
    corSuave: 'rgba(143, 203, 155, 0.10)',
    posicao: 'direita',
    tarefasBase: [
      'Dormir 7-8h',
      'Tratar rosto de manhã',
      'Pegar água',
      'Beber água',
      'Lanche 10:00',
      'Almoço',
      'Tratar rosto de tarde',
      'Dente.',
      'Pegar água',
      'Beber água',
      'Lanche 16:30',
      'Pegar água',
      'Beber água',
      'Corrida',
      'Exercício físico (Muay Thai)',
      'Tratar rosto de noite',
    ],
  },
  {
    id: 'sentimentos',
    nome: 'Sentimentos',
    cor: '#E89BB0',
    corSuave: 'rgba(232, 155, 176, 0.10)',
    posicao: 'baixo-esquerda',
    tarefasBase: [
      'Escrita para Deus',
      'Exercício postura',
      'Exercício fala',
    ],
  },
  {
    id: 'Estudo',
    nome: 'Estudo',
    cor: '#E3B778',
    corSuave: 'rgba(227, 183, 120, 0.10)',
    posicao: 'baixo-direita',
    tarefasBase: [
      'Aula de inglês. (15 a 40 minutos)',
      '2 aulas node.js',
      '2 Aulas PÓS',
      'Aula TI',
      'Ler livro',
      'Música inglês.',
      'Vídeo explicação inglês.',
      'Módulo + exercício Aslan.',
      'Projeto em uma linguagem de programação',
    ],
  },
];

const MANTER_EXTRAS_NO_RESET = false;

const CHAVE_STORAGE = 'tarefas-do-dia';

let estado = null;

function dataHoje() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function criarEstadoNovo(extrasAnteriores = {}) {
  const modulos = {};
  for (const m of MODULOS) {
    const base = m.tarefasBase.map((texto) => ({
      id: gerarId(),
      texto,
      feita: false,
      base: true,
    }));
    const extras = (extrasAnteriores[m.id] || []).map((t) => ({
      ...t,
      feita: false,
    }));
    modulos[m.id] = [...base, ...extras];
  }
  return { data: dataHoje(), modulos };
}

function carregarEstado() {
  let salvo = null;
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
  } catch {
    salvo = null;
  }

  if (!salvo || !salvo.modulos) {
    estado = criarEstadoNovo();
    salvarEstado();
    return;
  }

  if (salvo.data !== dataHoje()) {
    const extras = {};
    if (MANTER_EXTRAS_NO_RESET) {
      for (const id in salvo.modulos) {
        extras[id] = salvo.modulos[id].filter((t) => !t.base);
      }
    }
    estado = criarEstadoNovo(extras);
    salvarEstado();
    return;
  }

  for (const m of MODULOS) {
    if (!salvo.modulos[m.id]) {
      salvo.modulos[m.id] = m.tarefasBase.map((texto) => ({
        id: gerarId(),
        texto,
        feita: false,
        base: true,
      }));
    }
  }
  estado = salvo;
}

function salvarEstado() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
}

function adicionarTarefa(idModulo, texto) {
  const limpo = texto.trim();
  if (!limpo) return;
  estado.modulos[idModulo].push({
    id: gerarId(),
    texto: limpo,
    feita: false,
    base: false,
  });
  salvarEstado();
  renderizarModulo(idModulo);
  atualizarResumo();
}

function alternarTarefa(idModulo, idTarefa, feita) {
  const t = estado.modulos[idModulo].find((x) => x.id === idTarefa);
  if (!t) return;
  t.feita = feita;
  salvarEstado();
  atualizarContadores(idModulo);
  atualizarResumo();
}

function removerTarefa(idModulo, idTarefa) {
  estado.modulos[idModulo] = estado.modulos[idModulo].filter((x) => x.id !== idTarefa);
  salvarEstado();
  renderizarModulo(idModulo);
  atualizarResumo();
}

function reiniciarDia() {
  if (!confirm('Reiniciar o dia? Todas as tarefas serão desmarcadas e as extras removidas.')) return;
  estado = criarEstadoNovo();
  salvarEstado();
  renderizarTudo();
}


const painel = document.getElementById('painel');
const tplModulo = document.getElementById('tpl-modulo');
const tplTarefa = document.getElementById('tpl-tarefa');

function renderizarTudo() {
  painel.innerHTML = '';
  for (const m of MODULOS) {
    const el = tplModulo.content.firstElementChild.cloneNode(true);
    el.dataset.id = m.id;
    el.dataset.posicao = m.posicao;
    el.style.setProperty('--cor', m.cor);
    el.style.setProperty('--cor-suave', m.corSuave);

    el.querySelector('.modulo-nome').textContent = m.nome;
    el.querySelector('.modulo-epiteto').textContent = m['epíteto'] || '';

    const form = el.querySelector('.form-adicionar');
    const input = el.querySelector('.input-nova');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      adicionarTarefa(m.id, input.value);
      input.value = '';
      input.focus();
    });

    painel.appendChild(el);
    renderizarModulo(m.id);
  }
  atualizarResumo();
}

function renderizarModulo(idModulo) {
  const el = painel.querySelector(`.modulo[data-id="${CSS.escape(idModulo)}"]`);
  if (!el) return;
  const lista = el.querySelector('.lista');
  lista.innerHTML = '';

  for (const t of estado.modulos[idModulo]) {
    const li = tplTarefa.content.firstElementChild.cloneNode(true);
    li.dataset.id = t.id;
    li.classList.toggle('concluida', t.feita);

    const check = li.querySelector('.tarefa-check');
    check.checked = t.feita;
    check.addEventListener('change', () => {
      li.classList.toggle('concluida', check.checked);
      alternarTarefa(idModulo, t.id, check.checked);
    });

    li.querySelector('.tarefa-texto').textContent = t.texto;
    li.querySelector('.btn-remover').addEventListener('click', () => {
      removerTarefa(idModulo, t.id);
    });

    lista.appendChild(li);
  }

  atualizarContadores(idModulo);
}

function atualizarContadores(idModulo) {
  const el = painel.querySelector(`.modulo[data-id="${CSS.escape(idModulo)}"]`);
  if (!el) return;
  const tarefas = estado.modulos[idModulo];
  const total = tarefas.length;
  const feitas = tarefas.filter((t) => t.feita).length;
  const pendentes = total - feitas;

  const badge = el.querySelector('.contador-pendentes');
  badge.textContent = pendentes;
  badge.classList.toggle('zerado', pendentes === 0);
  badge.title = pendentes === 1 ? '1 pendente' : `${pendentes} pendentes`;

  el.querySelector('.contador-total').textContent = `${feitas}/${total}`;
  el.querySelector('.barra-preenchida').style.width =
    total === 0 ? '0%' : `${Math.round((feitas / total) * 100)}%`;
}

function atualizarResumo() {
  let total = 0;
  let feitas = 0;
  for (const id in estado.modulos) {
    for (const t of estado.modulos[id]) {
      total++;
      if (t.feita) feitas++;
    }
  }
  const pendentes = total - feitas;
  document.getElementById('resumo-geral').textContent =
    pendentes === 0 && total > 0
      ? `Tudo concluído · ${feitas}/${total}`
      : `${pendentes} pendente${pendentes === 1 ? '' : 's'} · ${feitas}/${total}`;
}

function mostrarData() {
  const texto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  document.getElementById('data-hoje').textContent = texto;
}

const CHAVE_TEMA = 'tema';

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  localStorage.setItem(CHAVE_TEMA, tema);
  document.querySelectorAll('.btn-tema').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.tema === tema));
  });
}

document.querySelectorAll('.btn-tema').forEach((btn) => {
  btn.addEventListener('click', () => aplicarTema(btn.dataset.tema));
});

aplicarTema(localStorage.getItem(CHAVE_TEMA) || 'escuro');

document.getElementById('btn-reiniciar').addEventListener('click', reiniciarDia);

carregarEstado();
mostrarData();
renderizarTudo();

setInterval(() => {
  if (estado.data !== dataHoje()) {
    carregarEstado();
    mostrarData();
    renderizarTudo();
  }
}, 60 * 1000);
