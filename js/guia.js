/*
 * guia.js — o "guia dos comandos" fixo no canto esquerdo da tela.
 *
 * Um cartão por comando, cada um com uma explicação curta e um exemplo de
 * "antes → depois" desenhado com caixinhas (vista de cima, bem simples, para
 * não competir com o tabuleiro isométrico).
 *
 * F1 e F2 ganham um cartão maior, porque é ali que mora o conceito que o jogo
 * quer ensinar: FUNÇÃO — comandos guardados com um nome e reaproveitados.
 *
 * Ordem dos cartões: primeiro os comandos que a fase atual oferece (com F1 e
 * F2 no topo, quando existem, por serem o assunto principal), depois os que
 * a fase não oferece, apagadinhos — alguns já vieram antes (o PULAR some na
 * fase 5), outros ainda vão chegar.
 *
 * Para mudar um texto, edite CONTEUDO abaixo. Não precisa mexer no resto.
 */

const Guia = (function () {

  /* ------------------------------------------------------- o conteúdo -- */

  /*
   * Exemplos "antes → depois": cada um é uma fileira de casas.
   *   robo:   "→", "↑" ou "↓" (para onde o robô olha) — ausente = sem robô
   *   altura: número mostrado na casa (só no exemplo do PULAR)
   *   alvo:   "apagado" ou "aceso"
   */
  const CONTEUDO = {
    AVANCAR: {
      texto: "Anda uma casa para a frente, na direção em que o robô está olhando. " +
             "Só funciona se a casa da frente tiver a mesma altura.",
      antes: [{ robo: "→" }, {}, {}],
      depois: [{}, { robo: "→" }, {}]
    },

    GIRAR_ESQ: {
      texto: "Vira o robô para a esquerda, sem sair do lugar. " +
             "Muda só para onde ele olha.",
      antes: [{ robo: "→" }],
      depois: [{ robo: "↑" }]
    },

    GIRAR_DIR: {
      texto: "Vira o robô para a direita, sem sair do lugar. " +
             "Muda só para onde ele olha.",
      antes: [{ robo: "→" }],
      depois: [{ robo: "↓" }]
    },

    PULAR: {
      texto: "Sobe um degrau (a casa da frente é exatamente 1 nível mais alta) " +
             "ou desce para uma casa mais baixa. Não serve para andar no plano.",
      antes: [{ robo: "→", altura: 1 }, { altura: 2 }],
      depois: [{ altura: 1 }, { robo: "→", altura: 2 }]
    },

    ACENDER: {
      texto: "Acende a casa amarela onde o robô está. " +
             "Ele precisa estar em cima dela — de longe não funciona.",
      antes: [{ robo: "→", alvo: "apagado" }],
      depois: [{ robo: "→", alvo: "aceso" }]
    },

    F1: {
      funcao: true,
      titulo: "Função",
      texto: "Uma função é um grupo de comandos guardado com um nome. " +
             "Você monta os comandos uma única vez na área F1. Depois, cada vez " +
             "que colocar F1 em outro lugar, o robô executa tudo o que está lá dentro.",
      exemploF1: ["AVANCAR", "ACENDER"],
      exemploPrincipal: ["F1", "F1", "F1"],
      conta: "3 comandos na PRINCIPAL + 2 na F1 = 5 no total, em vez de 6. " +
             "Quanto mais repetições, mais você economiza.",
      tituloLaco: "F1 chamando a própria F1",
      exemploLaco: ["AVANCAR", "ACENDER", "F1"],
      textoLaco: "Se o último comando da F1 for a própria F1, ela recomeça sozinha: " +
                 "é um laço. O robô para quando todas as casas estiverem acesas."
    },

    F2: {
      funcao: true,
      titulo: "Segunda função",
      texto: "Funciona igual à F1. Serve quando existem duas repetições " +
             "diferentes. E uma função pode chamar a outra: a F1 pode usar a F2 " +
             "dentro dela.",
      exemploF2: ["AVANCAR", "AVANCAR", "ACENDER"],
      exemploF1: ["F2", "F2", "GIRAR_DIR"]
    }
  };

  const ORDEM = ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1", "F2"];

  /* --------------------------------------------------- pedacinhos de DOM -- */

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  /* Uma "fichinha" de comando, com a mesma cor do botão da paleta, para o
   * aluno reconhecer que é a mesma coisa. */
  function ficha(cmd) {
    const f = el("span", "ficha");
    f.dataset.comando = cmd;
    f.appendChild(el("span", "ficha-icone", ICONES_COMANDO[cmd]));
    if (cmd !== "F1" && cmd !== "F2") {
      f.appendChild(el("span", "ficha-rotulo", ROTULOS_COMANDO[cmd]));
    }
    return f;
  }

  function linhaDeFichas(rotulo, comandos) {
    const linha = el("div", "guia-linha");
    if (rotulo) linha.appendChild(el("span", "guia-linha-rotulo", rotulo));
    const fichas = el("span", "guia-fichas");
    comandos.forEach(function (c) { fichas.appendChild(ficha(c)); });
    linha.appendChild(fichas);
    return linha;
  }

  /* Uma fileira de casas do exemplo antes/depois. */
  function fileira(casas) {
    const f = el("div", "mini-fileira");
    casas.forEach(function (casa) {
      const c = el("div", "mini-casa");
      if (casa.alvo) c.classList.add("mini-alvo-" + casa.alvo);
      if (casa.altura) {
        c.classList.add("mini-altura-" + casa.altura);
        c.appendChild(el("span", "mini-altura", String(casa.altura)));
      }
      if (casa.robo) {
        c.appendChild(el("span", "mini-robo", casa.robo));
      }
      f.appendChild(c);
    });
    return f;
  }

  function exemploAntesDepois(dados) {
    const box = el("div", "guia-exemplo");
    const antes = el("div", "guia-quadro");
    antes.appendChild(el("span", "guia-quadro-rotulo", "antes"));
    antes.appendChild(fileira(dados.antes));

    const depois = el("div", "guia-quadro");
    depois.appendChild(el("span", "guia-quadro-rotulo", "depois"));
    depois.appendChild(fileira(dados.depois));

    box.appendChild(antes);
    box.appendChild(el("span", "guia-seta", "→"));
    box.appendChild(depois);
    return box;
  }

  /* --------------------------------------------------------- os cartões -- */

  function cartaoSimples(cmd, dados) {
    const cartao = el("div", "guia-cartao");
    const cab = el("div", "guia-cabecalho");
    cab.appendChild(ficha(cmd));
    cartao.appendChild(cab);
    cartao.appendChild(el("p", "guia-texto", dados.texto));
    cartao.appendChild(exemploAntesDepois(dados));
    return cartao;
  }

  function cartaoF1(dados) {
    const cartao = el("div", "guia-cartao guia-cartao-funcao");
    cartao.dataset.comando = "F1";

    const cab = el("div", "guia-cabecalho");
    cab.appendChild(ficha("F1"));
    cab.appendChild(el("span", "guia-titulo-funcao", dados.titulo));
    cartao.appendChild(cab);

    cartao.appendChild(el("p", "guia-texto", dados.texto));

    const ex = el("div", "guia-codigo");
    ex.appendChild(el("div", "guia-subtitulo", "Exemplo"));
    ex.appendChild(linhaDeFichas("Na área F1:", dados.exemploF1));
    ex.appendChild(linhaDeFichas("Na PRINCIPAL:", dados.exemploPrincipal));

    // O que o robô realmente executa: a F1 "desdobrada" três vezes.
    const desdobrado = [];
    dados.exemploPrincipal.forEach(function () {
      dados.exemploF1.forEach(function (c) { desdobrado.push(c); });
    });
    const faz = linhaDeFichas("O robô faz:", desdobrado);
    faz.classList.add("guia-linha-resultado");
    ex.appendChild(faz);
    cartao.appendChild(ex);

    cartao.appendChild(el("p", "guia-conta", dados.conta));

    const laco = el("div", "guia-codigo");
    laco.appendChild(el("div", "guia-subtitulo", dados.tituloLaco));
    laco.appendChild(linhaDeFichas("Na área F1:", dados.exemploLaco));
    cartao.appendChild(laco);
    cartao.appendChild(el("p", "guia-texto", dados.textoLaco));

    return cartao;
  }

  function cartaoF2(dados) {
    const cartao = el("div", "guia-cartao guia-cartao-funcao");
    cartao.dataset.comando = "F2";

    const cab = el("div", "guia-cabecalho");
    cab.appendChild(ficha("F2"));
    cab.appendChild(el("span", "guia-titulo-funcao", dados.titulo));
    cartao.appendChild(cab);

    cartao.appendChild(el("p", "guia-texto", dados.texto));

    const ex = el("div", "guia-codigo");
    ex.appendChild(el("div", "guia-subtitulo", "Exemplo"));
    ex.appendChild(linhaDeFichas("Na área F2:", dados.exemploF2));
    ex.appendChild(linhaDeFichas("Na área F1:", dados.exemploF1));
    cartao.appendChild(ex);

    return cartao;
  }

  function criarCartao(cmd) {
    const dados = CONTEUDO[cmd];
    if (cmd === "F1") return cartaoF1(dados);
    if (cmd === "F2") return cartaoF2(dados);
    return cartaoSimples(cmd, dados);
  }

  /* -------------------------------------------------------- montagem --- */

  /*
   * Redesenha o guia para a fase atual.
   *   container   — elemento onde os cartões entram
   *   disponiveis — fase.comandosDisponiveis
   */
  function montar(container, disponiveis) {
    container.innerHTML = "";

    const liberados = ORDEM.filter(function (c) { return disponiveis.indexOf(c) >= 0; });
    const bloqueados = ORDEM.filter(function (c) { return disponiveis.indexOf(c) < 0; });

    // Funções no topo quando a fase as oferece: é o assunto da fase.
    const funcoes = liberados.filter(function (c) { return CONTEUDO[c].funcao; });
    const basicos = liberados.filter(function (c) { return !CONTEUDO[c].funcao; });

    funcoes.concat(basicos).forEach(function (cmd) {
      container.appendChild(criarCartao(cmd));
    });

    if (bloqueados.length) {
      container.appendChild(el("div", "guia-separador", "Não usados nesta fase"));
      bloqueados.forEach(function (cmd) {
        const cartao = criarCartao(cmd);
        cartao.classList.add("guia-cartao-bloqueado");
        container.appendChild(cartao);
      });
    }
  }

  return {
    montar: montar,
    CONTEUDO: CONTEUDO,
    ORDEM: ORDEM
  };
})();
