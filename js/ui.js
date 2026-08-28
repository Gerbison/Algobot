/*
 * ui.js — a cola entre a tela e o resto do jogo.
 *
 * Responsabilidades:
 *   - montar a paleta e as áreas de programação da fase atual;
 *   - deixar o aluno colocar comandos arrastando OU clicando;
 *   - tocar a execução passo a passo, animando o robô;
 *   - abrir as janelas (nome, fases, vitória, código, dica).
 *
 * Fluxo dos dados, do clique até o disco:
 *   clique/arraste  ->  programa{principal,f1,f2}  ->  Interpretador
 *   -> Motor (muda o estado)  ->  Render (desenha)
 *   -> ao vencer: Estrelas.calcular()  ->  Storage.registrarConclusao()
 */

(function () {

  /* ------------------------------------------------------------ estado -- */

  let progresso = Storage.carregarProgresso();
  let indiceFase = 0;              // posição dentro de FASES, não o id
  let fase = null;
  let estado = null;               // estado do motor
  let programa = { principal: [], f1: [], f2: [] };

  let execucao = null;
  let rodando = false;
  let timer = null;
  let areaAtiva = "principal";
  let comandoSelecionado = null;   // escolhido por clique na paleta

  // Interpolação do robô entre duas casas.
  let animacao = null;

  /* ------------------------------------------------------------ atalhos -- */

  const $ = function (id) { return document.getElementById(id); };
  const canvas = $("tabuleiro");

  /* ----------------------------------------------------- ciclo de fases -- */

  function carregarFase(indice) {
    pararExecucao();

    indiceFase = Math.max(0, Math.min(indice, FASES.length - 1));
    fase = FASES[indiceFase];
    estado = Motor.criarEstado(fase);
    animacao = null;

    // Cada área começa com o número de espaços da fase, todos vazios.
    programa = {
      principal: new Array(fase.espacos.principal).fill(null),
      f1: new Array(fase.espacos.f1).fill(null),
      f2: new Array(fase.espacos.f2).fill(null)
    };

    areaAtiva = "principal";
    comandoSelecionado = null;

    $("rotulo-fase").textContent = "Fase " + fase.id;
    $("nome-fase").textContent = fase.nome;
    $("selo-conceito").textContent = "Conceito: " + fase.conceito;

    montarPaleta();
    montarAreas();
    ajustarCanvas();
    mensagem("Monte a sequência de comandos e aperte Executar.", "");
    atualizarContador();
  }

  /* ------------------------------------------------------------ paleta -- */

  function montarPaleta() {
    const paleta = $("paleta");
    paleta.innerHTML = "";

    fase.comandosDisponiveis.forEach(function (cmd) {
      const botao = document.createElement("button");
      botao.className = "comando";
      botao.type = "button";
      botao.draggable = true;
      botao.dataset.comando = cmd;
      botao.innerHTML =
        '<span class="icone">' + ICONES_COMANDO[cmd] + "</span>" +
        '<span class="rotulo">' + ROTULOS_COMANDO[cmd] + "</span>";

      botao.addEventListener("dragstart", function (ev) {
        ev.dataTransfer.setData("text/plain", cmd);
        ev.dataTransfer.effectAllowed = "copy";
      });

      // Caminho do clique: escolhe o comando e já joga no primeiro espaço
      // livre da área destacada. Se não houver espaço, avisa em vez de
      // simplesmente não fazer nada.
      botao.addEventListener("click", function () {
        if (rodando) return;
        selecionarComando(cmd);
        const livre = programa[areaAtiva].indexOf(null);
        if (livre === -1) {
          mensagem("A área " + nomeArea(areaAtiva) + " está cheia. Clique em um comando dela para removê-lo.", "erro");
          return;
        }
        colocar(areaAtiva, livre, cmd);
      });

      paleta.appendChild(botao);
    });
  }

  function selecionarComando(cmd) {
    comandoSelecionado = cmd;
    document.querySelectorAll(".comando").forEach(function (b) {
      b.classList.toggle("selecionado", b.dataset.comando === cmd);
    });
  }

  function nomeArea(area) {
    return area === "principal" ? "PRINCIPAL" : area.toUpperCase();
  }

  /* ------------------------------------------------------------- áreas -- */

  function montarAreas() {
    const container = $("areas");
    container.innerHTML = "";

    ["principal", "f1", "f2"].forEach(function (area) {
      if (programa[area].length === 0) return; // fase não usa esta área

      const div = document.createElement("div");
      div.className = "area";
      div.dataset.area = area;

      const cabecalho = document.createElement("div");
      cabecalho.className = "area-cabecalho";
      cabecalho.innerHTML =
        '<span class="area-nome ' + area + '">' + nomeArea(area) + "</span>" +
        '<span class="area-contagem" data-contagem="' + area + '"></span>';
      div.appendChild(cabecalho);

      const slots = document.createElement("div");
      slots.className = "slots";
      for (let i = 0; i < programa[area].length; i++) {
        slots.appendChild(criarSlot(area, i));
      }
      div.appendChild(slots);

      // Clicar em qualquer canto da área a torna a área ativa (é nela que o
      // clique na paleta deposita o comando).
      div.addEventListener("click", function () {
        if (rodando) return;
        definirAreaAtiva(area);
      });

      container.appendChild(div);
    });

    definirAreaAtiva(areaAtiva);
    redesenharSlots();
  }

  function criarSlot(area, indice) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.area = area;
    slot.dataset.indice = indice;

    slot.addEventListener("dragover", function (ev) {
      if (rodando) return;
      ev.preventDefault();
      slot.classList.add("sobrevoo");
    });

    slot.addEventListener("dragleave", function () {
      slot.classList.remove("sobrevoo");
    });

    slot.addEventListener("drop", function (ev) {
      ev.preventDefault();
      slot.classList.remove("sobrevoo");
      if (rodando) return;
      const cmd = ev.dataTransfer.getData("text/plain");
      if (cmd) colocar(area, indice, cmd);
    });

    // Clique num espaço: coloca o comando selecionado se estiver vazio,
    // ou remove o que está lá se estiver cheio.
    slot.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (rodando) return;
      definirAreaAtiva(area);

      if (programa[area][indice]) {
        programa[area][indice] = null;
        redesenharSlots();
        atualizarContador();
      } else if (comandoSelecionado) {
        colocar(area, indice, comandoSelecionado);
      }
    });

    return slot;
  }

  function definirAreaAtiva(area) {
    areaAtiva = area;
    document.querySelectorAll(".area").forEach(function (el) {
      el.classList.toggle("ativa", el.dataset.area === area);
    });
  }

  function colocar(area, indice, comando) {
    programa[area][indice] = comando;
    redesenharSlots();
    atualizarContador();
    mensagem("Monte a sequência de comandos e aperte Executar.", "");
  }

  function redesenharSlots() {
    document.querySelectorAll(".slot").forEach(function (slot) {
      const cmd = programa[slot.dataset.area][Number(slot.dataset.indice)];
      slot.className = "slot" + (cmd ? " cheio" : "");
      if (cmd) {
        slot.dataset.comando = cmd;
        slot.innerHTML =
          '<span class="icone">' + ICONES_COMANDO[cmd] + "</span>" +
          '<span class="mini-rotulo">' + ROTULOS_COMANDO[cmd] + "</span>";
      } else {
        delete slot.dataset.comando;
        slot.innerHTML = "";
      }
    });

    ["principal", "f1", "f2"].forEach(function (area) {
      const alvo = document.querySelector('[data-contagem="' + area + '"]');
      if (!alvo) return;
      const usados = programa[area].filter(Boolean).length;
      alvo.textContent = usados + " / " + programa[area].length;
    });
  }

  function atualizarContador() {
    const total = Interpretador.contarComandos(programa);
    $("contador").textContent =
      total + (total === 1 ? " comando usado" : " comandos usados") +
      " · 3 estrelas até " + fase.estrelas.tres +
      " · 2 estrelas até " + fase.estrelas.duas;
  }

  /* --------------------------------------------------------- mensagens -- */

  function mensagem(texto, tipo) {
    const el = $("mensagem");
    el.textContent = texto;
    el.className = "mensagem" + (tipo ? " " + tipo : "");
  }

  function limparDestaques() {
    document.querySelectorAll(".slot").forEach(function (s) {
      s.classList.remove("executando", "falhou");
    });
  }

  function destacar(area, indice, classe) {
    limparDestaques();
    const slot = document.querySelector(
      '.slot[data-area="' + area + '"][data-indice="' + indice + '"]'
    );
    if (slot) slot.classList.add(classe);
  }

  /* --------------------------------------------------------- execução -- */

  function duracaoPasso() {
    return VELOCIDADES[$("velocidade").value] || VELOCIDADES.normal;
  }

  function executar() {
    if (rodando) return;

    if (Interpretador.contarComandos(programa) === 0) {
      mensagem("Coloque pelo menos um comando antes de executar.", "erro");
      return;
    }

    // Toda execução começa do zero: o tabuleiro volta ao estado da fase.
    estado = Motor.criarEstado(fase);
    animacao = null;
    execucao = Interpretador.criarExecucao(programa);
    rodando = true;

    $("btn-executar").disabled = true;
    $("btn-parar").disabled = false;
    limparDestaques();
    mensagem("Executando...", "");

    passo();
  }

  function passo() {
    if (!rodando) return;

    const instrucao = Interpretador.proximaInstrucao(execucao);

    if (instrucao.tipo === "fim") {
      rodando = false;
      restaurarBotoes();
      limparDestaques();
      mensagem("O programa terminou, mas ainda há alvos apagados. Ajuste os comandos e tente de novo.", "erro");
      return;
    }

    if (instrucao.tipo === "erro") {
      falhar(instrucao.area, instrucao.indice, instrucao.mensagem);
      return;
    }

    destacar(instrucao.area, instrucao.indice, "executando");

    const antes = {
      x: estado.robo.x,
      y: estado.robo.y,
      altura: Motor.alturaAtual(estado)
    };

    const resultado = Motor.aplicar(estado, instrucao.comando);

    if (!resultado.ok) {
      falhar(instrucao.area, instrucao.indice, resultado.mensagem);
      return;
    }

    const depois = {
      x: estado.robo.x,
      y: estado.robo.y,
      altura: Motor.alturaAtual(estado)
    };

    const duracao = duracaoPasso();

    if (resultado.animacao === "mover") {
      animacao = {
        de: antes,
        para: depois,
        inicio: performance.now(),
        duracao: duracao * 0.85,
        // O pulo ganha um arquinho extra para ficar claro que subiu/desceu.
        arco: instrucao.comando === "PULAR"
      };
    }

    // Vitória é verificada assim que o último alvo acende: o robô não precisa
    // terminar o programa (importante nas fases com F1 chamando a si mesma,
    // que nunca terminariam sozinhas).
    if (Motor.venceu(estado)) {
      rodando = false;
      timer = setTimeout(vencer, duracao);
      return;
    }

    timer = setTimeout(passo, duracao);
  }

  function falhar(area, indice, texto) {
    rodando = false;
    restaurarBotoes();
    destacar(area, indice, "falhou");
    mensagem(texto, "erro");
  }

  function pararExecucao() {
    rodando = false;
    if (timer) clearTimeout(timer);
    timer = null;
    restaurarBotoes();
  }

  function restaurarBotoes() {
    $("btn-executar").disabled = false;
    $("btn-parar").disabled = true;
  }

  function vencer() {
    restaurarBotoes();
    limparDestaques();

    const usados = Interpretador.contarComandos(programa);
    const estrelas = Estrelas.calcular(fase, usados);

    progresso = Storage.registrarConclusao(progresso, fase.id, estrelas, usados);

    $("estrelas-vitoria").textContent =
      "★".repeat(estrelas) + "☆".repeat(3 - estrelas);

    let texto = "Você usou " + usados + (usados === 1 ? " comando." : " comandos.");
    if (estrelas < 3) {
      texto += " Com " + fase.estrelas.tres + " ou menos você ganha as três estrelas.";
    } else {
      texto += " Solução ótima!";
    }
    $("texto-vitoria").textContent = texto;

    $("btn-proxima").disabled = indiceFase >= FASES.length - 1;
    $("btn-proxima").textContent =
      indiceFase >= FASES.length - 1 ? "Você terminou tudo!" : "Próxima fase";

    mensagem("Fase concluída!", "sucesso");
    abrirJanela("janela-vitoria");
  }

  /* -------------------------------------------------------- animação --- */

  /* Onde desenhar o robô neste instante. Fora de uma animação é a posição
   * exata do estado; durante, é a interpolação entre as duas casas. */
  function visualDoRobo() {
    const alturaAtual = Motor.alturaAtual(estado);
    const base = {
      x: estado.robo.x,
      y: estado.robo.y,
      altura: alturaAtual,
      direcao: estado.robo.direcao
    };

    if (!animacao) return base;

    const t = (performance.now() - animacao.inicio) / animacao.duracao;
    if (t >= 1) {
      animacao = null;
      return base;
    }

    // Suavização (ease-in-out) para o passo não parecer robótico demais.
    const s = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    let altura = animacao.de.altura + (animacao.para.altura - animacao.de.altura) * s;
    if (animacao.arco) {
      // meia senoide: sobe no meio do trajeto e volta
      altura += Math.sin(s * Math.PI) * 0.35;
    }

    return {
      x: animacao.de.x + (animacao.para.x - animacao.de.x) * s,
      y: animacao.de.y + (animacao.para.y - animacao.de.y) * s,
      altura: altura,
      direcao: estado.robo.direcao
    };
  }

  function lacoDeDesenho() {
    if (estado) {
      Render.desenhar(estado, visualDoRobo());
    }
    requestAnimationFrame(lacoDeDesenho);
  }

  /* ---------------------------------------------------------- canvas --- */

  function ajustarCanvas() {
    const caixa = $("caixa-canvas");
    canvas.width = Math.max(320, caixa.clientWidth - 2);
    canvas.height = Math.max(240, caixa.clientHeight - 2);
    Render.enquadrar(fase);
  }

  /* --------------------------------------------------------- janelas --- */

  function abrirJanela(id) {
    $("cortina").classList.remove("oculto");
    document.querySelectorAll(".janela").forEach(function (j) {
      j.classList.toggle("oculto", j.id !== id);
    });
  }

  function fecharJanelas() {
    $("cortina").classList.add("oculto");
    document.querySelectorAll(".janela").forEach(function (j) {
      j.classList.add("oculto");
    });
  }

  function montarListaFases() {
    const lista = $("lista-fases");
    lista.innerHTML = "";

    FASES.forEach(function (f, i) {
      const registro = progresso.fases[f.id];
      const liberada = f.id <= progresso.faseMaxima;

      const botao = document.createElement("button");
      botao.className = "cartao-fase";
      botao.type = "button";
      botao.disabled = !liberada;
      botao.innerHTML =
        '<span class="numero">' + f.id + "</span>" +
        '<span class="titulo">' + f.nome + "</span>" +
        '<span class="estrelas">' +
        (registro ? "★".repeat(registro.estrelas) + "☆".repeat(3 - registro.estrelas) : "☆☆☆") +
        "</span>";

      botao.addEventListener("click", function () {
        fecharJanelas();
        carregarFase(i);
      });

      lista.appendChild(botao);
    });
  }

  /* ----------------------------------------------------------- eventos -- */

  function ligarEventos() {
    $("btn-executar").addEventListener("click", executar);

    $("btn-parar").addEventListener("click", function () {
      pararExecucao();
      limparDestaques();
      mensagem("Execução interrompida.", "");
    });

    $("btn-limpar").addEventListener("click", function () {
      if (rodando) pararExecucao();
      ["principal", "f1", "f2"].forEach(function (area) {
        programa[area] = programa[area].map(function () { return null; });
      });
      estado = Motor.criarEstado(fase);
      animacao = null;
      redesenharSlots();
      atualizarContador();
      limparDestaques();
      mensagem("Áreas limpas. Comece de novo.", "");
    });

    $("btn-dica").addEventListener("click", function () {
      $("texto-dica").textContent = fase.dica;
      abrirJanela("janela-dica");
    });

    $("btn-fases").addEventListener("click", function () {
      montarListaFases();
      abrirJanela("janela-fases");
    });

    $("btn-codigo").addEventListener("click", function () {
      $("texto-codigo").textContent = Estrelas.gerarCodigo(progresso, FASES);
      abrirJanela("janela-codigo");
    });

    $("btn-proxima").addEventListener("click", function () {
      fecharJanelas();
      if (indiceFase < FASES.length - 1) carregarFase(indiceFase + 1);
    });

    $("btn-refazer").addEventListener("click", function () {
      fecharJanelas();
      carregarFase(indiceFase);
    });

    $("btn-apagar-progresso").addEventListener("click", function () {
      if (!window.confirm("Isso apaga seu nome e todas as estrelas deste computador. Continuar?")) return;
      Storage.apagarTudo();
      progresso = Storage.progressoVazio();
      fecharJanelas();
      carregarFase(0);
      pedirNome();
    });

    $("btn-confirmar-nome").addEventListener("click", confirmarNome);
    $("campo-nome").addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") confirmarNome();
    });

    document.querySelectorAll(".fechar-janela").forEach(function (b) {
      b.addEventListener("click", fecharJanelas);
    });

    window.addEventListener("resize", function () {
      if (fase) ajustarCanvas();
    });
  }

  function pedirNome() {
    $("campo-nome").value = progresso.nome || "";
    abrirJanela("janela-nome");
    setTimeout(function () { $("campo-nome").focus(); }, 50);
  }

  function confirmarNome() {
    const nome = $("campo-nome").value.trim();
    if (!nome) {
      $("campo-nome").focus();
      return;
    }
    progresso.nome = nome;
    Storage.salvarProgresso(progresso);
    $("nome-aluno").textContent = nome;
    fecharJanelas();
  }

  /* ----------------------------------------------------------- partida -- */

  function iniciar() {
    document.title = NOME_JOGO;
    $("titulo-jogo").textContent = NOME_JOGO;
    $("nome-jogo-boas-vindas").textContent = NOME_JOGO;
    $("nome-aluno").textContent = progresso.nome || "";

    Render.iniciar(canvas);
    ligarEventos();

    // Retoma na maior fase liberada, para o aluno não ter que procurar.
    const alvo = FASES.findIndex(function (f) { return f.id === progresso.faseMaxima; });
    carregarFase(alvo >= 0 ? alvo : 0);

    lacoDeDesenho();

    if (!progresso.nome) pedirNome();
  }

  window.addEventListener("DOMContentLoaded", iniciar);
})();
