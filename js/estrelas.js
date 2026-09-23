/*
 * estrelas.js — pontuação e código de conclusão.
 *
 * Três coisas moram aqui:
 *   1) quantas estrelas a solução do aluno vale;
 *   2) o código curto (ALG-XXXX-XXXX) que carrega o progresso inteiro;
 *   3) ler esse código de volta — é assim que o jogo salva progresso "sem
 *      banco de dados": o código É o save, e cabe numa mensagem de texto.
 *
 * Sobre o código: ele carrega as ESTRELAS de cada fase, em ordem, e um
 * resumo (hash) do nome digitado. O nome NÃO volta a partir do código —
 * ele é curto demais para isso. O que dá para fazer é CONFERIR se um nome
 * digitado bate com o código, o que resolve o problema real: impedir que
 * um aluno use o código do colega para pular fases.
 */

const Estrelas = (function () {

  /* Alfabeto base32 sem I, L, O e U — para o aluno não confundir 1/I, 0/O
   * ao ditar o código em voz alta ou escrever no papel. */
  const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  function calcular(fase, quantidadeComandos) {
    if (quantidadeComandos <= fase.estrelas.tres) return 3;
    if (quantidadeComandos <= fase.estrelas.duas) return 2;
    return 1;
  }

  /* Hash FNV-1a de 32 bits. Não é criptografia — é só para amarrar o código
   * ao nome. Determinístico e igual em qualquer computador.
   *
   * Tira acento antes de comparar ("Luíza" e "Luiza" batem): o aluno pode
   * digitar o nome de um jeito num computador e de outro jeito no seguinte
   * (teclado sem acento, autocorretor, pressa), e isso não pode impedir de
   * continuar o próprio progresso. */
  function hashNome(nome) {
    const limpo = String(nome || "").trim()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toUpperCase();
    let h = 0x811c9dc5;
    for (let i = 0; i < limpo.length; i++) {
      h = h ^ limpo.charCodeAt(i);
      // multiplicação por 16777619 em 32 bits, sem estourar o Number
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function bitsParaBase32(bits) {
    let saida = "";
    // completa a última fatia com zeros para fechar múltiplo de 5 bits
    while (bits.length % 5 !== 0) bits += "0";
    for (let i = 0; i < bits.length; i += 5) {
      saida += ALFABETO[parseInt(bits.slice(i, i + 5), 2)];
    }
    return saida;
  }

  function base32ParaBits(texto) {
    let bits = "";
    for (let i = 0; i < texto.length; i++) {
      const v = ALFABETO.indexOf(texto[i]);
      if (v < 0) return null;
      bits += v.toString(2).padStart(5, "0");
    }
    return bits;
  }

  /*
   * Monta o código. progresso.fases é { "1": {estrelas, comandos}, ... }.
   * Cada fase vira 2 bits (0 a 3 estrelas), na ordem de FASES.
   */
  function gerarCodigo(progresso, listaFases) {
    let bits = "";
    listaFases.forEach(function (f) {
      const registro = progresso.fases[f.id];
      const e = registro ? registro.estrelas : 0;
      bits += (e & 3).toString(2).padStart(2, "0");
    });

    const corpo = bitsParaBase32(bits);

    // 20 bits do hash do nome = 4 caracteres base32
    const assinatura = bitsParaBase32(
      (hashNome(progresso.nome) & 0xfffff).toString(2).padStart(20, "0")
    );

    return "ALG-" + corpo + "-" + assinatura;
  }

  /*
   * Lê um código. Devolve:
   *   { valido: true, estrelas: [3,2,0,...], assinatura: "XXXX" }
   *   { valido: false, motivo: "..." }
   *
   * Atenção: por causa do preenchimento com zeros, o código pode devolver
   * até duas fases a mais do que existiam quando foi gerado, sempre com
   * 0 estrelas. O painel do professor deve cortar a lista no total de fases
   * que ele conhece.
   */
  function decodificarCodigo(codigo) {
    const partes = String(codigo || "").trim().toUpperCase().split("-");
    if (partes.length !== 3 || partes[0] !== "ALG") {
      return { valido: false, motivo: "O código deve ter o formato ALG-XXXX-XXXX." };
    }

    const bits = base32ParaBits(partes[1]);
    if (bits === null) {
      return { valido: false, motivo: "O código tem letras que não existem no formato." };
    }

    const estrelas = [];
    for (let i = 0; i + 2 <= bits.length; i += 2) {
      estrelas.push(parseInt(bits.slice(i, i + 2), 2));
    }

    return { valido: true, estrelas: estrelas, assinatura: partes[2] };
  }

  /* Confere se o código foi gerado por alguém que digitou este nome. */
  function conferirNome(codigo, nome) {
    const lido = decodificarCodigo(codigo);
    if (!lido.valido) return false;
    const esperada = bitsParaBase32(
      (hashNome(nome) & 0xfffff).toString(2).padStart(20, "0")
    );
    return lido.assinatura === esperada;
  }

  /*
   * Reconstrói um progresso a partir de um código — o "continuar em outro
   * computador" sem banco de dados nenhum: o código carrega tudo que é
   * preciso, e o localStorage da máquina nova recebe uma cópia.
   *
   * Devolve:
   *   { ok: true,  progresso: { nome, faseMaxima, fases } }
   *   { ok: false, motivo: "..." }
   *
   * O número de comandos de cada fase não vem no código (só a quantidade de
   * estrelas — ver o comentário de gerarCodigo). Para não inventar um valor
   * errado, reconstituímos o MAIOR número de comandos que ainda garante
   * aquela quantidade de estrelas; se o aluno um dia refizer a fase melhor,
   * Storage.registrarConclusao troca pelo valor real, como já faz sempre.
   */
  function restaurarProgresso(codigo, nomeDigitado, listaFases) {
    const nome = String(nomeDigitado || "").trim();
    if (!nome) {
      return { ok: false, motivo: "Digite o nome antes de continuar." };
    }

    const lido = decodificarCodigo(codigo);
    if (!lido.valido) {
      return { ok: false, motivo: lido.motivo };
    }
    if (!conferirNome(codigo, nome)) {
      return {
        ok: false,
        motivo: "Esse código não confere com esse nome. Digite o nome exatamente como da vez passada."
      };
    }

    const fases = {};
    let faseMaxima = 1;

    listaFases.forEach(function (f, i) {
      const e = lido.estrelas[i] || 0;
      if (e <= 0) return;

      const comandos = e >= 3 ? f.estrelas.tres : e === 2 ? f.estrelas.duas : f.estrelas.duas + 1;
      fases[f.id] = { estrelas: e, comandos: comandos };
      if (f.id + 1 > faseMaxima) faseMaxima = f.id + 1;
    });

    return { ok: true, progresso: { nome: nome, faseMaxima: faseMaxima, fases: fases } };
  }

  /* ------------------------------------- "salvar e continuar depois" -- */

  /*
   * Texto do e-mail que o aluno manda para si mesmo, para continuar em
   * outro computador. Separado de gerarCodigo: aqui o destino é o próprio
   * aluno, não o professor, e o corpo explica como usar o código de volta.
   */
  function partesContinuar(codigo, nome) {
    const assunto = NOME_JOGO + " — meu código para continuar depois";
    const corpo = [
      "Guarde este e-mail. Ele tem o código para continuar de onde você parou",
      "no " + NOME_JOGO + ", em qualquer computador.",
      "",
      "Nome usado no jogo: " + (nome || "—"),
      "Código: " + codigo,
      "",
      "Para continuar: abra o " + NOME_JOGO + ", clique em \"Já jogou em outro",
      "computador?\", digite o nome EXATAMENTE como está acima e cole este código."
    ].join("\n");
    return { assunto: assunto, corpo: corpo };
  }

  /* mailto — funciona em qualquer navegador, mas depende de haver um
   * programa de e-mail configurado na máquina. */
  function linkContinuar(destino, codigo, nome) {
    const p = partesContinuar(codigo, nome);
    return "mailto:" + destino +
      "?subject=" + encodeURIComponent(p.assunto) +
      "&body=" + encodeURIComponent(p.corpo);
  }

  /* Gmail na web — não depende de programa nenhum instalado, só de internet.
   * É a opção padrão porque bate com o ecossistema da escola (Chromebook). */
  function linkContinuarGmail(destino, codigo, nome) {
    const p = partesContinuar(codigo, nome);
    return "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(destino) +
      "&su=" + encodeURIComponent(p.assunto) + "&body=" + encodeURIComponent(p.corpo);
  }

  return {
    calcular: calcular,
    gerarCodigo: gerarCodigo,
    decodificarCodigo: decodificarCodigo,
    conferirNome: conferirNome,
    hashNome: hashNome,
    restaurarProgresso: restaurarProgresso,
    linkContinuar: linkContinuar,
    linkContinuarGmail: linkContinuarGmail
  };
})();
