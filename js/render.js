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
 * ORDEM DE DESENHO: casas mais "à frente" precisam ser pintadas por cima das
 * de trás. Profundidade aqui é (x + y): quanto maior, mais na frente. Um laço
 * com y por fora e x por dentro já garante isso, porque as três casas capazes
 * de tapar a casa (x,y) — (x+1,y), (x,y+1) e (x+1,y+1) — sempre vêm depois
 * nessa ordem. O robô é desenhado no meio do laço, quando chegamos na casa
 * dele, e não no fim: assim uma casa alta na frente o esconde de verdade.
 * ---------------------------------------------------------------------------
 */

const Render = (function () {

  let canvas = null;
  let ctx = null;

  // Calculado uma vez por fase: quanto deslocar e reduzir para o tabuleiro
  // caber inteiro no canvas.
  let enquadramento = { offsetX: 0, offsetY: 0, escala: 1 };

  function iniciar(elementoCanvas) {
    canvas = elementoCanvas;
    ctx = canvas.getContext("2d");
  }

  /* Converte coordenada de jogo em pixel, antes do enquadramento. */
  function paraTela(x, y, altura) {
    return {
      x: (x - y) * (LARGURA_TILE / 2),
      y: (x + y) * (ALTURA_TILE / 2) - altura * ALTURA_NIVEL
    };
  }

  /*
   * Mede o tabuleiro inteiro e descobre o deslocamento e a escala que fazem
   * ele caber no canvas com uma margem. Chamar sempre que a fase mudar ou a
   * janela for redimensionada.
   */
  function enquadrar(fase) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (let y = 0; y < fase.grade.length; y++) {
      for (let x = 0; x < fase.grade[y].length; x++) {
        const alt = fase.grade[y][x];
        if (!alt) continue;

        const topo = paraTela(x, y, alt);
        const base = paraTela(x, y, 0);

        minX = Math.min(minX, topo.x - LARGURA_TILE / 2);
        maxX = Math.max(maxX, topo.x + LARGURA_TILE / 2);
        // O ponto mais alto é o vértice de cima do losango do topo...
        minY = Math.min(minY, topo.y - ALTURA_TILE / 2 - 34); // 34 = folga p/ o robô
        // ...e o mais baixo é o pé da coluna, no nível do chão.
        maxY = Math.max(maxY, base.y + ALTURA_TILE / 2 + 8);
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

  /* Desenha uma casa: o losango do topo mais as duas faces laterais visíveis. */
  function desenharCasa(estado, x, y, tempo) {
    const alt = estado.fase.grade[y][x];
    if (!alt) return;

    const e = enquadramento.escala;
    const centro = aplicarEnquadramento(paraTela(x, y, alt));
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
   * Desenha o robô. visual.x/visual.y são frações (ex.: 2.4) durante a
   * animação de movimento; visual.altura idem, para a subida do PULAR.
   * visual.giro é o índice da direção, também fracionário durante o giro.
   */
  function desenharRobo(visual, tempo) {
    const e = enquadramento.escala;
    const base = aplicarEnquadramento(paraTela(visual.x, visual.y, visual.altura));

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

    /* Visor: fica no lado para onde o robô olha. Cada direção tem um
     * deslocamento isométrico próprio — é o mesmo (x-y, x+y) das casas,
     * aplicado ao vetor unitário da direção. */
    const anguloIso = {
      NORTE: { dx: 1, dy: -1 },
      LESTE: { dx: 1, dy: 1 },
      SUL: { dx: -1, dy: 1 },
      OESTE: { dx: -1, dy: -1 }
    }[visual.direcao];

    const vx = base.x + anguloIso.dx * corpoL * 0.34;
    const vy = cy + anguloIso.dy * corpoA * 0.20;

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

    ctx.fillStyle = CORES.fundo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grade = estado.fase.grade;
    // A casa em que o robô "está" para efeito de ordem de desenho.
    const roboX = Math.round(visual.x);
    const roboY = Math.round(visual.y);
    let roboDesenhado = false;

    for (let y = 0; y < grade.length; y++) {
      for (let x = 0; x < grade[y].length; x++) {
        desenharCasa(estado, x, y, tempo);
        if (x === roboX && y === roboY) {
          desenharRobo(visual, tempo);
          roboDesenhado = true;
        }
      }
    }

    // Se o robô estiver fora da grade (não deveria acontecer), desenha por cima
    // para ele nunca sumir da tela sem explicação.
    if (!roboDesenhado) {
      desenharRobo(visual, tempo);
    }
  }

  return {
    iniciar: iniciar,
    enquadrar: enquadrar,
    desenhar: desenhar
  };
})();
