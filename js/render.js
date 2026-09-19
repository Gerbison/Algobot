/*
 * render.js — desenho do tabuleiro no Canvas 2D.
 *
 * ---------------------------------------------------------------------------
 * A PROJEÇÃO ISOMÉTRICA (a parte não óbvia deste arquivo)
 * ---------------------------------------------------------------------------
 * A grade é quadrada em coordenadas de jogo (x para o leste, y para o sul),
 * mas na tela queremos ver o tabuleiro "de canto", com losangos. A conversão é:
 *
 *     telaX = (x - y) * (LARGURA_TILE / 2)
 *     telaY = (x + y) * (ALTURA_TILE  / 2) - altura * ALTURA_NIVEL
 *
 * Ou seja: andar para o leste move para baixo-e-direita, andar para o sul move
 * para baixo-e-esquerda, e a altura simplesmente sobe o desenho na vertical.
 * Como ALTURA_TILE é metade de LARGURA_TILE, os losangos ficam na proporção
 * 2:1, que é o visual isométrico clássico.
 *
 * ---------------------------------------------------------------------------
 * GIRAR A CÂMERA
 * ---------------------------------------------------------------------------
 * O aluno pode girar o tabuleiro para enxergar o que está escondido atrás de
 * uma casa alta. Em vez de ter quatro projeções diferentes, giramos as
 * COORDENADAS em torno do centro do tabuleiro e depois aplicamos sempre a
 * mesma projeção acima:
 *
 *     p' = centro + R(θ) · (p - centro)
 *
 * Duas consequências boas de fazer assim:
 *   1. θ pode ser um valor qualquer, não só múltiplo de 90°, e o giro fica
 *      animado de graça — basta interpolar θ;
 *   2. como giramos em torno do centro, o tabuleiro nunca "escapa" da tela.
 *
 * ATENÇÃO: isto é só câmera. O motor continua raciocinando em NORTE/SUL/
 * LESTE/OESTE do tabuleiro; girar a vista não muda uma vírgula na lógica dos
 * comandos.
 *
 * ---------------------------------------------------------------------------
 * ORDEM DE DESENHO
 * ---------------------------------------------------------------------------
 * Casas mais "à frente" precisam ser pintadas por cima das de trás.
 * Profundidade aqui é (x + y) DEPOIS do giro: quanto maior, mais na frente.
 * O robô NÃO entra nessa conta como um número: ele é encaixado por regras
 * (casa em que pisa, paredes à frente) numa ordenação topológica refeita a
 * cada quadro. Está tudo explicado em ordemDeDesenho(), mais abaixo, e
 * conferido por test/render.test.js.
 * ---------------------------------------------------------------------------
 */

const Render = (function () {

  let canvas = null;
  let ctx = null;
  let faseAtual = null;

  // Calculado uma vez por fase: quanto deslocar e reduzir para o tabuleiro
  // caber inteiro no canvas, em qualquer ângulo de câmera.
  let enquadramento = { offsetX: 0, offsetY: 0, escala: 1 };

  // Ângulo da câmera, em radianos. "Alvo" é para onde o aluno mandou girar;
  // "atual" persegue o alvo a cada quadro, produzindo a animação.
  let anguloAtual = 0;
  let anguloAlvo = 0;

  function iniciar(elementoCanvas) {
    canvas = elementoCanvas;
    ctx = canvas.getContext("2d");
  }

  /* ------------------------------------------------------------- câmera -- */

  /* passos = +1 gira um quarto de volta no sentido horário, -1 anti-horário. */
  function girar(passos) {
    anguloAlvo += passos * (Math.PI / 2);
  }

  function reiniciarCamera() {
    anguloAtual = 0;
    anguloAlvo = 0;
  }

  /* Quantos quartos de volta a câmera já deu (0 a 3), para quem precisar
   * saber a orientação — por exemplo, para girar junto o visor do robô. */
  function quartosDeVolta() {
    const q = Math.round(anguloAtual / (Math.PI / 2)) % 4;
    return (q + 4) % 4;
  }

  /* Centro do tabuleiro em coordenadas de jogo. É em torno dele que giramos. */
  function centroDaGrade(fase) {
    let largura = 0;
    fase.grade.forEach(function (linha) {
      largura = Math.max(largura, linha.length);
    });
    return { x: (largura - 1) / 2, y: (fase.grade.length - 1) / 2 };
  }

  /* Aplica o giro da câmera a uma coordenada de jogo. Aceita valores
   * fracionários — é assim que o robô é animado entre duas casas. */
  function girarCoord(x, y, angulo, centro) {
    const dx = x - centro.x;
    const dy = y - centro.y;
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    return {
      x: centro.x + dx * cos - dy * sen,
      y: centro.y + dx * sen + dy * cos
    };
  }

  /* ---------------------------------------------------------- projeção -- */

  function paraTela(x, y, altura) {
    return {
      x: (x - y) * (LARGURA_TILE / 2),
      y: (x + y) * (ALTURA_TILE / 2) - altura * ALTURA_NIVEL
    };
  }

  /*
   * Mede o tabuleiro e descobre deslocamento e escala para ele caber no canvas.
   *
   * Medimos a UNIÃO das quatro orientações, não só a atual. Se medíssemos só a
   * atual, um tabuleiro não quadrado mudaria de escala no meio do giro e a
   * imagem ficaria "respirando". Assim ele fica parado, e só gira.
   */
  function enquadrar(fase) {
    faseAtual = fase;
    const centro = centroDaGrade(fase);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let volta = 0; volta < 4; volta++) {
      const angulo = volta * (Math.PI / 2);

      for (let y = 0; y < fase.grade.length; y++) {
        for (let x = 0; x < fase.grade[y].length; x++) {
          const alt = fase.grade[y][x];
          if (!alt) continue;

          const g = girarCoord(x, y, angulo, centro);
          const topo = paraTela(g.x, g.y, alt);
          const base = paraTela(g.x, g.y, 0);

          minX = Math.min(minX, topo.x - LARGURA_TILE / 2);
          maxX = Math.max(maxX, topo.x + LARGURA_TILE / 2);
          // O ponto mais alto é o vértice de cima do losango, com folga para o robô...
          minY = Math.min(minY, topo.y - ALTURA_TILE / 2 - 34);
          // ...e o mais baixo é o pé da coluna, no nível do chão.
          maxY = Math.max(maxY, base.y + ALTURA_TILE / 2 + 8);
        }
      }
    }

    const largura = maxX - minX;
    const altura = maxY - minY;
    const margem = 24;

    const escala = Math.min(
      (canvas.width - margem * 2) / largura,
      (canvas.height - margem * 2) / altura,
      1.25
    );

    enquadramento = {
      escala: escala,
      offsetX: canvas.width / 2 - (minX + largura / 2) * escala,
      offsetY: canvas.height / 2 - (minY + altura / 2) * escala
    };
  }

  function aplicarEnquadramento(p) {
    return {
      x: p.x * enquadramento.escala + enquadramento.offsetX,
      y: p.y * enquadramento.escala + enquadramento.offsetY
    };
  }

  /* ----------------------------------------------------------- desenho -- */

  function poligono(pontos, preenchimento, contorno) {
    ctx.beginPath();
    ctx.moveTo(pontos[0].x, pontos[0].y);
    for (let i = 1; i < pontos.length; i++) {
      ctx.lineTo(pontos[i].x, pontos[i].y);
    }
    ctx.closePath();
    if (preenchimento) {
      ctx.fillStyle = preenchimento;
      ctx.fill();
    }
    if (contorno) {
      ctx.strokeStyle = contorno;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* Desenha uma casa: o losango do topo mais as duas faces laterais visíveis.
   * "girada" já vem com o giro da câmera aplicado. */
  function desenharCasa(estado, x, y, girada, tempo) {
    const alt = estado.fase.grade[y][x];

    const e = enquadramento.escala;
    const centro = aplicarEnquadramento(paraTela(girada.x, girada.y, alt));
    const meiaL = (LARGURA_TILE / 2) * e;
    const meiaA = (ALTURA_TILE / 2) * e;
    // Altura da coluna na tela: os níveis de altura mais uma saia fixa, para
    // que até uma casa de altura 1 mostre lateral.
    const coluna = (alt * ALTURA_NIVEL + 8) * e;

    const alvo = Motor.ehAlvo(estado, x, y);
    const aceso = Motor.estaAceso(estado, x, y);

    // Faces laterais primeiro (ficam por baixo do topo).
    poligono([
      { x: centro.x - meiaL, y: centro.y },
      { x: centro.x, y: centro.y + meiaA },
      { x: centro.x, y: centro.y + meiaA + coluna },
      { x: centro.x - meiaL, y: centro.y + coluna }
    ], CORES.faceEsquerda, CORES.contorno);

    poligono([
      { x: centro.x + meiaL, y: centro.y },
      { x: centro.x, y: centro.y + meiaA },
      { x: centro.x, y: centro.y + meiaA + coluna },
      { x: centro.x + meiaL, y: centro.y + coluna }
    ], CORES.faceDireita, CORES.contorno);

    // Topo. Alvo aceso pulsa de leve para chamar atenção.
    let corTopo = CORES.topoNormal;
    if (alvo && aceso) {
      const pulso = 0.5 + 0.5 * Math.sin(tempo / 260);
      corTopo = pulso > 0.5 ? CORES.alvoAceso : CORES.alvoAcesoBrilho;
    } else if (alvo) {
      corTopo = CORES.alvoApagado;
    }

    poligono([
      { x: centro.x, y: centro.y - meiaA },
      { x: centro.x + meiaL, y: centro.y },
      { x: centro.x, y: centro.y + meiaA },
      { x: centro.x - meiaL, y: centro.y }
    ], corTopo, CORES.contorno);

    // Marca do alvo ainda apagado: um losango vazado no meio.
    if (alvo && !aceso) {
      poligono([
        { x: centro.x, y: centro.y - meiaA * 0.5 },
        { x: centro.x + meiaL * 0.5, y: centro.y },
        { x: centro.x, y: centro.y + meiaA * 0.5 },
        { x: centro.x - meiaL * 0.5, y: centro.y }
      ], null, CORES.alvoApagadoTopo);
    }

    // Halo de luz da casa acesa.
    if (alvo && aceso) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = CORES.alvoAcesoBrilho;
      ctx.beginPath();
      ctx.ellipse(centro.x, centro.y, meiaL * 1.4, meiaA * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /*
   * Desenha o robô. "girada" é a posição dele já com o giro da câmera;
   * visual.altura pode ser fracionária durante o pulo.
   */
  function desenharRobo(visual, girada, angulo, tempo) {
    const e = enquadramento.escala;
    const base = aplicarEnquadramento(paraTela(girada.x, girada.y, visual.altura));

    const corpoL = 20 * e;
    const corpoA = 26 * e;
    const flutuar = Math.sin(tempo / 400) * 1.5 * e;
    const cy = base.y - corpoA * 0.55 + flutuar;

    // Sombra no chão da casa que está debaixo do robô. Durante um pulo ela
    // fica embaixo enquanto o corpo sobe, e encolhe e clareia com a distância:
    // é isso que faz o olho ler "pulou", e não "deslizou para cima".
    const alturaChao = visual.alturaChao === undefined ? visual.altura : visual.alturaChao;
    const noAr = Math.max(0, visual.altura - alturaChao);
    const chao = aplicarEnquadramento(paraTela(girada.x, girada.y, alturaChao));
    const encolher = Math.max(0.45, 1 - noAr * 0.35);
    ctx.save();
    ctx.globalAlpha = 0.3 * encolher;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(chao.x, chao.y, corpoL * 0.7 * encolher, corpoL * 0.35 * encolher, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Corpo: cápsula vermelha.
    ctx.fillStyle = CORES.roboEscuro;
    ctx.beginPath();
    ctx.ellipse(base.x, base.y - corpoA * 0.15, corpoL * 0.55, corpoL * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CORES.robo;
    ctx.beginPath();
    ctx.ellipse(base.x, cy, corpoL * 0.5, corpoA * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antena.
    ctx.strokeStyle = CORES.roboVisor;
    ctx.lineWidth = 2 * e;
    ctx.beginPath();
    ctx.moveTo(base.x, cy - corpoA * 0.5);
    ctx.lineTo(base.x, cy - corpoA * 0.78);
    ctx.stroke();
    ctx.fillStyle = CORES.alvoAceso;
    ctx.beginPath();
    ctx.arc(base.x, cy - corpoA * 0.82, 3 * e, 0, Math.PI * 2);
    ctx.fill();

    /* Visor: fica no lado para onde o robô olha.
     * Pegamos o vetor da direção em coordenadas de jogo, giramos ele pelo
     * mesmo ângulo da câmera e projetamos. Assim o visor acompanha o giro
     * de forma contínua, sem depender de uma tabela por orientação. */
    const v = VETOR_DIRECAO[visual.direcao];
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    const gdx = v.dx * cos - v.dy * sen;
    const gdy = v.dx * sen + v.dy * cos;

    const vx = base.x + (gdx - gdy) * corpoL * 0.34;
    const vy = cy + (gdx + gdy) * corpoA * 0.20;

    ctx.fillStyle = CORES.roboVisor;
    ctx.beginPath();
    ctx.ellipse(vx, vy, corpoL * 0.20, corpoA * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ------------------------------------------------ movimento do robô -- */

  /*
   * Onde o robô está no instante t (0 a 1) de um passo de casa em casa.
   *   de, para — { x, y, altura } das duas casas
   *   direcao  — para onde o robô olha
   *
   * Devolve o "visual" que desenhar() usa:
   *   x, y      posição fracionária no tabuleiro
   *   altura    altura do corpo, com o arco do pulo
   *   alturaChao altura da casa que está debaixo do robô (onde vai a sombra)
   *   origem, destino  as duas casas inteiras do passo — é por elas que a
   *                    profundidade de desenho é decidida (ver desenhar)
   *
   * O PULO: quando as duas casas têm alturas diferentes, o robô não desliza
   * em diagonal — ele faz um arco. A altura é a reta entre as duas alturas
   * somada a uma parábola que vale 0 nas pontas e é máxima no meio:
   *
   *     altura(s) = hDe + (hPara - hDe)·s + k · 4·s·(1 - s)
   *
   * 4·s·(1-s) é a parábola mais simples que começa em 0, termina em 0 e chega a
   * 1 no meio. k é a força do pulo: 0,6 nível de base e mais um quarto de nível
   * por degrau de diferença, para que a queda de 3 níveis da fase 18 também
   * dê um pulinho antes de cair, e não pareça um escorregão. Vale para
   * qualquer mudança de nível, subindo ou descendo, em qualquer fase —
   * a condição é só "as alturas são diferentes", não qual comando foi usado.
   */
  function interpolar(de, para, t, direcao) {
    // Suavização (ease-in-out): arranca devagar, acelera, e freia na chegada.
    const s = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const desnivel = para.altura - de.altura;
    const forcaDoPulo = desnivel === 0 ? 0 : 0.6 + 0.25 * Math.abs(desnivel);
    const altura = de.altura + desnivel * s + forcaDoPulo * 4 * s * (1 - s);

    return {
      x: de.x + (para.x - de.x) * s,
      y: de.y + (para.y - de.y) * s,
      altura: altura,
      // A sombra fica no chão da casa que está debaixo do robô: a de origem
      // na primeira metade do passo, a de destino na segunda.
      alturaChao: s < 0.5 ? de.altura : para.altura,
      direcao: direcao,
      origem: { x: de.x, y: de.y, altura: de.altura },
      destino: { x: para.x, y: para.y, altura: para.altura }
    };
  }

  /* Robô parado numa casa: origem e destino são a mesma. */
  function parado(x, y, altura, direcao) {
    return {
      x: x, y: y, altura: altura, alturaChao: altura, direcao: direcao,
      origem: { x: x, y: y, altura: altura },
      destino: { x: x, y: y, altura: altura }
    };
  }

  /*
   * Ordem de desenho: a lista de casas e o robô, de trás para frente.
   * Separada de desenhar() para poder ser testada sem canvas.
   *
   * ---------------------------------------------------------------------------
   * AS CASAS
   * ---------------------------------------------------------------------------
   * Ordenadas por x + y depois do giro da câmera: quanto maior, mais à frente.
   * Duas casas com o mesmo x + y ficam lado a lado na tela e nunca se cobrem,
   * então a ordem entre elas é livre.
   *
   * ---------------------------------------------------------------------------
   * O ROBÔ (a correção do "robô atravessando o chão")
   * ---------------------------------------------------------------------------
   * O jeito antigo dava ao robô um número de profundidade, x + y da posição
   * INTERPOLADA. No meio do caminho entre uma casa de profundidade 3 e outra de
   * 4 o robô ficava com 3,5, e a casa 4 era pintada depois dele, cobrindo o
   * corpo — medido: até 52% dele sumia num passo no plano, e 100% na queda da
   * fase 18.
   *
   * Um número só não resolve, e a medição mostrou por quê: na fase 16 o robô
   * anda ao longo de um muro alto, e a casa de destino e o muro têm o MESMO
   * x + y. Qualquer número que ponha o robô depois do destino também o põe
   * depois do muro, e ele aparece de repente na frente da parede.
   *
   * Então o robô é tratado como uma pequena área no chão (um quadrado de lado
   * 2·RAIO_ROBO em volta da posição exata dele, a cada quadro) e comparado com
   * a área de cada casa:
   *
   *  - Casa INTEIRA À FRENTE do robô (mais ao sul ou mais a leste, sem estar
   *    atrás no outro eixo): pintada DEPOIS dele. É a parede que o esconde.
   *  - Casa INTEIRA ATRÁS: pintada ANTES.
   *  - Casas do passo (origem e destino), que a área do robô cruza: vale a
   *    altura. Se o corpo do robô está na altura do topo dela ou acima, ele
   *    está sobre ela e é pintado DEPOIS — nunca atravessa o chão em que pisa
   *    nem o chão para onde vai. Se o topo está acima do robô E a casa está à
   *    frente dele (subindo para um bloco mais alto na frente, ou caindo para
   *    trás de uma torre), ela é uma parede naquele instante e é pintada
   *    DEPOIS dele, escondendo-o.
   *  - Qualquer outra: fica ao lado na tela, a ordem não importa.
   *
   * Por que a elevação não entra na comparação de profundidade: toda casa é
   * uma coluna que vai até o chão. Uma coluna mais à frente continua na frente
   * do robô, por mais alto que ele esteja; somar a elevação faria um robô no
   * alto de uma torre ser pintado por cima das paredes que devem escondê-lo.
   * A altura só decide o caso das casas que o robô está pisando.
   *
   * Com a câmera parada em múltiplos de 90° os quadrados continuam alinhados e
   * a comparação é exata; durante a animação do giro ela é uma aproximação.
   */
  const RAIO_ROBO = 0.3; // metade da largura do robô, em casas

  // Quantas vezes a ordem de desenho precisou do plano B (regras em
  // conflito). Existe para o teste poder afirmar que isso não acontece.
  let vezesPlanoB = 0;

  function ordemDeDesenho(fase, visual, angulo) {
    const grade = fase.grade;
    const centro = centroDaGrade(fase);
    const casas = [];

    for (let y = 0; y < grade.length; y++) {
      for (let x = 0; x < grade[y].length; x++) {
        if (!grade[y][x]) continue;
        const g = girarCoord(x, y, angulo, centro);
        casas.push({ tipo: "casa", x: x, y: y, altura: grade[y][x], girada: g, profundidade: g.x + g.y });
      }
    }
    casas.sort(function (a, b) { return a.profundidade - b.profundidade; });

    const origem = visual.origem || { x: Math.round(visual.x), y: Math.round(visual.y) };
    const destino = visual.destino || origem;
    const gRobo = girarCoord(visual.x, visual.y, angulo, centro);

    // Área do robô no chão, já no referencial girado.
    const r = {
      x0: gRobo.x - RAIO_ROBO, x1: gRobo.x + RAIO_ROBO,
      y0: gRobo.y - RAIO_ROBO, y1: gRobo.y + RAIO_ROBO
    };
    const FOLGA = 0.001;

    function ehDoPasso(casa) {
      return (casa.x === origem.x && casa.y === origem.y) ||
             (casa.x === destino.x && casa.y === destino.y);
    }

    // "antes": pintar antes do robô; "depois": pintar depois; null: tanto faz.
    function relacao(casa) {
      if (ehDoPasso(casa)) {
        // Sobre a casa: por cima dela, sempre.
        if (visual.altura >= casa.altura - FOLGA) return "antes";
        // Topo acima do robô: só é parede se estiver À FRENTE dele. Subindo
        // para um bloco mais alto que fica atrás (fase 18, para o oeste), o
        // robô continua na frente do bloco e é pintado por cima.
        return casa.profundidade > gRobo.x + gRobo.y + FOLGA ? "depois" : "antes";
      }
      const c = casa.girada;
      const x0 = c.x - 0.5, x1 = c.x + 0.5, y0 = c.y - 0.5, y1 = c.y + 0.5;
      const aFrente = x0 >= r.x1 - FOLGA || y0 >= r.y1 - FOLGA;
      const atras = x1 <= r.x0 + FOLGA || y1 <= r.y0 + FOLGA;
      if (aFrente && !atras) return "depois";
      if (atras && !aFrente) return "antes";
      return null;
    }

    const robo = { tipo: "robo", girada: gRobo, profundidade: gRobo.x + gRobo.y };

    /*
     * Encaixar o robô num único ponto da lista ordenada não basta. Com a
     * câmera girada, andando "para dentro" da tela, a casa de onde ele saiu
     * fica À FRENTE dele e ele precisa ficar por cima dela; mas um muro que
     * também está à frente pode vir ANTES dessa casa na lista — e aí qualquer
     * ponto de encaixe erra um dos dois.
     *
     * O que resolve é lembrar que uma casa só precisa vir antes de outra se as
     * duas se SOBREPÕEM NA TELA. Casas lado a lado podem trocar de ordem à
     * vontade. Então montamos as restrições de verdade e fazemos uma ordenação
     * topológica (algoritmo de Kahn), escolhendo sempre, entre os itens
     * liberados, o de menor profundidade:
     *   - casa A antes de casa B se B está mais à frente e as duas se cruzam
     *     na horizontal da tela;
     *   - "antes" / "depois" do robô, pela relacao() acima, para as casas que
     *     cruzam o robô na horizontal.
     *
     * Na horizontal da tela, a posição é x − y (depois do giro): uma casa
     * ocupa ±1 nessa medida, e o robô, com a sombra, cerca de ±0,5.
     */
    const lista = casas.concat([robo]);
    const n = lista.length;
    const ROBO = n - 1;
    const horizontal = lista.map(function (it) { return it.girada.x - it.girada.y; });
    const seguintes = lista.map(function () { return []; });
    const pendentes = new Array(n).fill(0);

    function restricao(a, b) { seguintes[a].push(b); pendentes[b]++; }

    for (let i = 0; i < casas.length; i++) {
      for (let j = 0; j < casas.length; j++) {
        if (casas[i].profundidade < casas[j].profundidade - FOLGA &&
            Math.abs(horizontal[i] - horizontal[j]) < 2 - FOLGA) {
          restricao(i, j);
        }
      }
      if (Math.abs(horizontal[i] - horizontal[ROBO]) < 1.5) {
        const rel = relacao(casas[i]);
        if (rel === "antes") restricao(i, ROBO);
        else if (rel === "depois") restricao(ROBO, i);
      }
    }

    const ordem = [];
    const feito = new Array(n).fill(false);
    while (ordem.length < n) {
      let escolhido = -1;
      for (let k = 0; k < n; k++) {
        if (!feito[k] && pendentes[k] === 0 &&
            (escolhido < 0 || lista[k].profundidade < lista[escolhido].profundidade)) {
          escolhido = k;
        }
      }
      if (escolhido < 0) break; // restrições em ciclo: usa o plano B abaixo
      feito[escolhido] = true;
      ordem.push(lista[escolhido]);
      seguintes[escolhido].forEach(function (s) { pendentes[s]--; });
    }
    if (ordem.length === n) return ordem;

    /* Plano B, só se as regras entrarem em conflito (não aconteceu em nenhum
     * passo das soluções das 22 fases, nas 4 posições de câmera): robô logo
     * depois da última casa que precisa ficar atrás dele. */
    vezesPlanoB++;
    let posicao = 0;
    casas.forEach(function (casa, i) {
      if (relacao(casa) === "antes") posicao = i + 1;
    });
    return casas.slice(0, posicao).concat([robo], casas.slice(posicao));
  }

  /*
   * Desenha o quadro inteiro.
   *   estado — do motor
   *   visual — ver interpolar() e parado()
   */
  function desenhar(estado, visual) {
    const tempo = performance.now();

    // A câmera persegue o ângulo alvo. O fator 0.18 é o quanto ela fecha a
    // distância por quadro: dá um giro de cerca de meio segundo, rápido o
    // bastante para não cansar e lento o bastante para o aluno acompanhar
    // que lado virou para onde.
    const resto = anguloAlvo - anguloAtual;
    if (Math.abs(resto) < 0.001) {
      anguloAtual = anguloAlvo;
    } else {
      anguloAtual += resto * 0.18;
    }

    ctx.fillStyle = CORES.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tudo que vai ser desenhado, já com o giro aplicado, de trás para frente.
    // O robô entra na lista como mais um item: assim uma casa alta na frente
    // dele o esconde de verdade. A regra está explicada em ordemDeDesenho().
    const itens = ordemDeDesenho(estado.fase, visual, anguloAtual);

    itens.forEach(function (item) {
      if (item.tipo === "casa") {
        desenharCasa(estado, item.x, item.y, item.girada, tempo);
      } else {
        desenharRobo(visual, item.girada, anguloAtual, tempo);
      }
    });
  }

  return {
    iniciar: iniciar,
    enquadrar: enquadrar,
    desenhar: desenhar,
    girar: girar,
    reiniciarCamera: reiniciarCamera,
    quartosDeVolta: quartosDeVolta,
    interpolar: interpolar,
    parado: parado,
    ordemDeDesenho: ordemDeDesenho,
    vezesPlanoB: function () { return vezesPlanoB; }
  };
})();
