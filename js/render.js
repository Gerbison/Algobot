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
 * Como as coordenadas giradas não seguem mais a ordem das linhas da matriz,
 * montamos a lista de tudo que vai ser desenhado (casas + robô) e ordenamos
 * por profundidade a cada quadro. São no máximo 64 casas — ordenar isso 60
 * vezes por segundo não custa nada, e é muito mais simples de conferir do que
 * tentar adivinhar a ordem certa do laço para cada ângulo.
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

    // Sombra no chão.
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, corpoL * 0.7, corpoL * 0.35, 0, 0, Math.PI * 2);
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

  /*
   * Desenha o quadro inteiro.
   *   estado — do motor
   *   visual — { x, y, altura, direcao } posição interpolada do robô
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

    const grade = estado.fase.grade;
    const centro = centroDaGrade(estado.fase);

    // Monta tudo que vai ser desenhado, já com o giro aplicado, e ordena por
    // profundidade (de trás para frente). O robô entra na lista como mais um
    // item: assim uma casa alta na frente dele o esconde de verdade.
    const itens = [];

    for (let y = 0; y < grade.length; y++) {
      for (let x = 0; x < grade[y].length; x++) {
        if (!grade[y][x]) continue;
        const g = girarCoord(x, y, anguloAtual, centro);
        itens.push({ tipo: "casa", x: x, y: y, girada: g, profundidade: g.x + g.y });
      }
    }

    const gRobo = girarCoord(visual.x, visual.y, anguloAtual, centro);
    itens.push({
      tipo: "robo",
      girada: gRobo,
      // O empurrãozinho garante que o robô venha depois da própria casa,
      // mesmo quando os dois têm exatamente a mesma profundidade.
      profundidade: gRobo.x + gRobo.y + 0.001
    });

    itens.sort(function (a, b) { return a.profundidade - b.profundidade; });

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
    quartosDeVolta: quartosDeVolta
  };
})();
