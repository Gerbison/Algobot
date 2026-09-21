/*
 * captura.js — gera uma imagem PNG da fase para o aluno enviar.
 *
 * A imagem não é um "print" da tela: é montada num canvas à parte, com tudo
 * que o professor precisa para entender o que está vendo, numa só figura:
 *
 *   ┌──────────────────────────────────────────┐
 *   │ AlgoBot · Fase 5 — Não cabe tudo          │  cabeçalho: fase, conceito,
 *   │ Aluno: Maria · 17/09/2026 14:32           │  nome e data
 *   ├──────────────────────────────────────────┤
 *   │            [ tabuleiro atual ]            │  cópia do canvas do jogo
 *   ├──────────────────────────────────────────┤
 *   │ PRINCIPAL  [F1][F1][F1]                   │  o programa montado
 *   │ F1         [↑ AVANÇAR][↑ AVANÇAR][✹ ...]  │
 *   ├──────────────────────────────────────────┤
 *   │ ★★★ Fase concluída com 6 comandos         │  situação
 *   └──────────────────────────────────────────┘
 *
 * Montar à parte, em vez de fotografar o DOM, tem dois motivos: o navegador não
 * deixa uma página tirar print de si mesma sem biblioteca externa (e o jogo não
 * usa nenhuma), e assim a imagem sai igual em qualquer tamanho de tela.
 *
 * Nada aqui envia a imagem para lugar nenhum. Quem decide para onde vai é o
 * aluno, pelos botões da janela de captura (baixar, copiar, compartilhar).
 */

const Captura = (function () {

  const LARGURA = 1000;
  const MARGEM = 24;

  const COR = {
    fundo: "#0b111b",
    painel: "#16243a",
    borda: "#24354f",
    texto: "#e6ecf5",
    suave: "#8fb3dd",
    apagado: "#6d819b",
    sucesso: "#b8f0cd",
    erro: "#ffc9d1"
  };

  // Mesmas cores dos botões da paleta, para o professor reconhecer.
  const COR_FICHA = {
    padrao: "#2f5480",
    F1: "#6a4b8f",
    F2: "#2f7d70",
    ACENDER: "#a37f18"
  };

  const FICHA_ALTURA = 38;
  const FICHA_ESPACO = 8;

  /* Retângulo arredondado feito à mão: ctx.roundRect ainda não existe em
   * todo navegador de escola. */
  function retanguloArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function textoFicha(cmd) {
    return (cmd === "F1" || cmd === "F2")
      ? cmd
      : ICONES_COMANDO[cmd] + "  " + ROTULOS_COMANDO[cmd];
  }

  function larguraFicha(ctx, cmd) {
    ctx.font = "bold 15px 'Segoe UI', Roboto, sans-serif";
    return Math.max(52, ctx.measureText(textoFicha(cmd)).width + 26);
  }

  /*
   * Distribui as fichas de uma área em linhas que caibam na largura.
   * Devolve a lista de linhas, cada uma com as fichas e suas posições x.
   * Usada duas vezes: uma para medir a altura total, outra para desenhar.
   */
  function quebrarEmLinhas(ctx, comandos, larguraDisponivel) {
    const linhas = [[]];
    let x = 0;
    comandos.forEach(function (cmd) {
      const w = larguraFicha(ctx, cmd);
      if (x > 0 && x + w > larguraDisponivel) {
        linhas.push([]);
        x = 0;
      }
      linhas[linhas.length - 1].push({ cmd: cmd, x: x, w: w });
      x += w + FICHA_ESPACO;
    });
    return linhas;
  }

  /*
   * dados = {
   *   canvasTabuleiro, fase, programa, aluno,
   *   resultado: { estrelas, usados } | null,
   *   mensagem: texto da barra de mensagens, tipoMensagem: "erro"|"sucesso"|""
   * }
   * Devolve um <canvas> pronto para virar PNG.
   */
  function gerar(dados) {
    const saida = document.createElement("canvas");
    const ctx = saida.getContext("2d");

    const areas = ["principal", "f1", "f2"].filter(function (a) {
      return dados.fase.espacos[a] > 0;
    });

    /* ---- 1ª passada: medir. A altura da imagem depende de quantas linhas
     * de fichas cada área ocupa, e o canvas precisa do tamanho antes. ---- */

    const ROTULO_AREA = 120;
    const larguraFichas = LARGURA - MARGEM * 2 - ROTULO_AREA - 16;

    const layoutAreas = areas.map(function (area) {
      const comandos = (dados.programa[area] || []).filter(Boolean);
      const linhas = comandos.length ? quebrarEmLinhas(ctx, comandos, larguraFichas) : [[]];
      return { area: area, comandos: comandos, linhas: linhas };
    });

    const alturaCabecalho = 92;

    const tab = dados.canvasTabuleiro;
    const escalaTab = Math.min((LARGURA - MARGEM * 2) / tab.width, 520 / tab.height);
    const tabW = Math.round(tab.width * escalaTab);
    const tabH = Math.round(tab.height * escalaTab);

    let alturaPrograma = 20 + 26; // respiro + título "Programa"
    layoutAreas.forEach(function (l) {
      alturaPrograma += l.linhas.length * (FICHA_ALTURA + FICHA_ESPACO) + 14;
    });

    const alturaRodape = 64;

    saida.width = LARGURA;
    saida.height = alturaCabecalho + tabH + MARGEM * 2 + alturaPrograma + alturaRodape;

    /* ---- 2ª passada: desenhar. ---- */

    ctx.fillStyle = COR.fundo;
    ctx.fillRect(0, 0, saida.width, saida.height);

    // Cabeçalho
    ctx.fillStyle = COR.painel;
    ctx.fillRect(0, 0, LARGURA, alturaCabecalho);
    ctx.fillStyle = COR.borda;
    ctx.fillRect(0, alturaCabecalho - 1, LARGURA, 1);

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#e63946";
    ctx.font = "bold 22px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("▶", MARGEM, 38);

    ctx.fillStyle = COR.texto;
    ctx.fillText(NOME_JOGO + "  ·  Fase " + dados.fase.id + " — " + dados.fase.nome, MARGEM + 30, 38);

    ctx.font = "15px 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = COR.suave;
    const agora = new Date().toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    ctx.fillText(
      "Conceito: " + dados.fase.conceito + "   ·   Aluno: " + (dados.aluno || "—") + "   ·   " + agora,
      MARGEM + 30, 68
    );

    // Tabuleiro
    let y = alturaCabecalho + MARGEM;
    const tabX = Math.round((LARGURA - tabW) / 2);
    ctx.fillStyle = COR.borda;
    retanguloArredondado(ctx, tabX - 1, y - 1, tabW + 2, tabH + 2, 10);
    ctx.fill();
    ctx.save();
    retanguloArredondado(ctx, tabX, y, tabW, tabH, 9);
    ctx.clip();
    ctx.drawImage(tab, tabX, y, tabW, tabH);
    ctx.restore();
    y += tabH + MARGEM;

    // Programa
    ctx.fillStyle = COR.suave;
    ctx.font = "bold 13px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("PROGRAMA MONTADO", MARGEM, y + 14);
    y += 30;

    layoutAreas.forEach(function (l) {
      const nome = l.area === "principal" ? "PRINCIPAL" : l.area.toUpperCase();
      const corNome = l.area === "f1" ? "#b795e0" : l.area === "f2" ? "#6fd3c0" : COR.suave;

      ctx.fillStyle = corNome;
      ctx.font = "bold 15px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(nome, MARGEM, y + 25);

      ctx.fillStyle = COR.apagado;
      ctx.font = "12px 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(l.comandos.length + " de " + dados.fase.espacos[l.area], MARGEM, y + 41);

      const x0 = MARGEM + ROTULO_AREA;

      if (!l.comandos.length) {
        ctx.fillStyle = COR.apagado;
        ctx.font = "italic 14px 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("(vazia)", x0, y + 25);
      }

      l.linhas.forEach(function (linha, i) {
        const ly = y + i * (FICHA_ALTURA + FICHA_ESPACO);
        linha.forEach(function (f) {
          ctx.fillStyle = COR_FICHA[f.cmd] || COR_FICHA.padrao;
          retanguloArredondado(ctx, x0 + f.x, ly, f.w, FICHA_ALTURA, 7);
          ctx.fill();
          ctx.fillStyle = "#eaf2ff";
          ctx.font = "bold 15px 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(textoFicha(f.cmd), x0 + f.x + f.w / 2, ly + 25);
          ctx.textAlign = "left";
        });
      });

      y += l.linhas.length * (FICHA_ALTURA + FICHA_ESPACO) + 14;
    });

    // Rodapé: situação da fase
    const yRodape = saida.height - alturaRodape;
    ctx.fillStyle = COR.painel;
    ctx.fillRect(0, yRodape, LARGURA, alturaRodape);
    ctx.fillStyle = COR.borda;
    ctx.fillRect(0, yRodape, LARGURA, 1);

    let situacao;
    let corSituacao = COR.texto;
    const total = Interpretador.contarComandos(dados.programa);

    if (dados.resultado) {
      situacao = "★".repeat(dados.resultado.estrelas) + "☆".repeat(3 - dados.resultado.estrelas) +
                 "   Fase concluída com " + dados.resultado.usados +
                 (dados.resultado.usados === 1 ? " comando" : " comandos");
      corSituacao = "#ffd447";
    } else if (dados.tipoMensagem === "erro") {
      situacao = "Ainda não resolvida — " + dados.mensagem;
      corSituacao = COR.erro;
    } else {
      situacao = "Em andamento — " + total + (total === 1 ? " comando usado" : " comandos usados");
    }

    ctx.fillStyle = corSituacao;
    ctx.font = "bold 17px 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(situacao, MARGEM, yRodape + 39, LARGURA - MARGEM * 2);

    return saida;
  }

  /* Nome de arquivo previsível: fácil de achar na pasta de downloads e de
   * ordenar quando o professor recebe vários. */
  function nomeArquivo(fase, aluno) {
    const limpo = String(aluno || "aluno")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aluno";
    const d = new Date();
    const data = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
                 String(d.getDate()).padStart(2, "0");
    return "algobot-fase-" + String(fase.id).padStart(2, "0") + "-" + limpo + "-" + data + ".png";
  }

  /*
   * Monta o link "mailto:" do botão Enviar por e-mail.
   *
   * Um mailto NÃO consegue anexar arquivo — é um limite de segurança de todo
   * navegador, não deste jogo. Por isso o corpo da mensagem avisa que a
   * imagem foi baixada e pede para anexá-la; quem chama esta função (ui.js)
   * é responsável por disparar o download antes de abrir o e-mail.
   *
   *   destino   — endereço do professor (EMAIL_PROFESSOR)
   *   fase      — fase atual
   *   aluno     — nome digitado, pode vir vazio
   *   resultado — { estrelas, usados } se a fase foi concluída, ou null
   *   arquivo   — nome do PNG que foi baixado (Captura.nomeArquivo)
   */
  function linkEmail(destino, fase, aluno, resultado, arquivo) {
    const situacao = resultado
      ? "Estrelas: " + "★".repeat(resultado.estrelas) + "☆".repeat(3 - resultado.estrelas) +
        " (" + resultado.usados + (resultado.usados === 1 ? " comando)" : " comandos)")
      : "Ainda em andamento.";

    const assunto = NOME_JOGO + " - Fase " + fase.id + " - " + (aluno || "aluno");

    const corpo = [
      "Fase " + fase.id + ": " + fase.nome,
      "Aluno: " + (aluno || "—"),
      situacao,
      "",
      "A imagem desta fase foi baixada automaticamente como \"" + arquivo + "\".",
      "Anexe esse arquivo (pasta Downloads) antes de enviar este e-mail."
    ].join("\n");

    // O destinatário não é codificado: é só letras, pontos e "@", e alguns
    // clientes de e-mail leem melhor sem "%40" no meio do endereço.
    return "mailto:" + destino +
      "?subject=" + encodeURIComponent(assunto) +
      "&body=" + encodeURIComponent(corpo);
  }

  return {
    gerar: gerar,
    nomeArquivo: nomeArquivo,
    linkEmail: linkEmail
  };
})();
