# AlgoBot — Manual

## Como abrir o jogo

Dê **duplo clique em `index.html`**. Só isso. Não precisa de servidor, não
precisa de internet, não precisa instalar nada.

Funciona em Chrome e Firefox atualizados. Para levar para o laboratório, copie
a pasta inteira num pendrive — os arquivos precisam ficar juntos.

## Como se joga

1. Digite um nome na primeira tela (fica guardado só naquele computador).
2. Arraste comandos da paleta **Comandos** para os espaços, ou clique num
   comando e ele cai no primeiro espaço livre da área destacada em amarelo.
3. Para tirar um comando, clique nele dentro do espaço.
4. Aperte **▶ Executar**.

Se o robô errar, ele para onde falhou, o comando problemático fica vermelho e a
mensagem explica o que aconteceu. Não existe "game over" — é só corrigir e
rodar de novo.

### Girar a vista

Nos tabuleiros com casas altas, uma casa pode esconder outra. Os dois botões no
canto superior direito do tabuleiro (**↺** e **↻**) giram a câmera um quarto de
volta, para o aluno enxergar o que está atrás. Também dá para usar as teclas
**Q** e **E**.

Isso é **só ponto de vista**: girar a câmera não muda nada na lógica dos
comandos. `GIRAR ESQ` e `GIRAR DIR` continuam sendo em relação ao robô, e
`AVANÇAR` continua indo para onde o visor dele aponta — e o visor gira junto
com a tela, então o que se vê continua batendo com o que acontece.

### Os comandos

| Comando | O que faz |
|---|---|
| AVANÇAR | anda uma casa na direção em que o robô olha — só entre casas da **mesma altura** |
| GIRAR ESQ / GIRAR DIR | gira 90°, sem sair do lugar |
| PULAR | sobe exatamente 1 nível, ou desce para uma casa mais baixa |
| ACENDER | acende a casa onde o robô está (só funciona em casa-alvo) |
| F1 / F2 | executa a sub-rotina 1 ou 2 |

`F1` e `F2` podem chamar a si mesmas. É assim que se faz um laço.

### A revisão em TypeScript

Ao concluir uma fase, junto com as estrelas aparece um retorno em três partes:

1. **O que você acabou de fazer** — uma frase nomeando, em termos de
   programação, o que a solução do aluno é: uma sequência direta, uma função,
   ou uma recursão.
2. **A sua solução em TypeScript** — os comandos do tabuleiro traduzidos em
   código de verdade. `AVANÇAR` vira `avancar()`, a área F1 vira
   `function f1(): void { ... }`, e assim por diante.
3. **Um jeito mais simples** — quando existe. Chamar `f1()` quatro vezes seguidas
   vira um `for`; uma F1 que chama a si mesma vira um `while`.

Esse terceiro bloco fala de **como escrever**, nunca de qual é a resposta da
fase — a descoberta do caminho continua sendo do aluno. Quando não há nada a
simplificar (uma sequência sem repetição), o jogo diz isso em vez de inventar
uma sugestão.

Para usar em aula: a mesma fase resolvida com e sem F1 mostra lado a lado a
diferença entre repetir código e reaproveitar código — é o gancho para
apresentar função e laço.

### Estrelas

- **1 estrela** — completou.
- **2 estrelas** — usou até o limite mostrado embaixo dos botões.
- **3 estrelas** — achou a solução ótima.

O que conta é **quantos comandos foram escritos**, não quantas vezes eles
rodaram. É isso que premia quem descobre a sub-rotina.

## Como criar uma fase nova

Abra `js/fases.js` e acrescente um objeto no fim do array `FASES`. Exemplo
comentado linha a linha:

```javascript
{
  // 13 porque a última fase existente é a 12. O id precisa ser único e
  // sequencial: é ele que controla o desbloqueio da fase seguinte.
  id: 13,

  nome: "Minha fase nova",     // aparece no topo da tela
  conceito: "sub-rotina",      // vira o selo "Conceito: sub-rotina"

  // O tabuleiro. Cada linha é um y, cada coluna é um x.
  //   0     = buraco: essa casa não existe
  //   1 a 4 = a casa existe e tem essa altura
  // y cresce para o SUL (para baixo-esquerda na tela).
  // Use de 4x4 até 8x8; não precisa ser quadrado.
  grade: [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 2],   // a casa (3,2) tem altura 2: vai precisar de PULAR
    [1, 0, 0, 0]
  ],

  // As casas que precisam ser acesas. Elas aparecem amarelas no tabuleiro.
  // Atenção à ordem: {x: coluna, y: linha}.
  alvos: [
    { x: 3, y: 0 },
    { x: 3, y: 2 }
  ],

  // Onde o robô começa e para onde olha.
  // direcao: "NORTE", "SUL", "LESTE" ou "OESTE".
  robo: { x: 0, y: 0, direcao: "LESTE" },

  // Quantos espaços cada área tem. Colocar 0 esconde a área da tela.
  // ---> É AQUI QUE MORA A PEDAGOGIA. Se a PRINCIPAL for grande demais,
  //      a solução em linha reta cabe e o aluno nunca precisa da F1.
  espacos: { principal: 5, f1: 6, f2: 0 },

  // Quais botões aparecem na paleta desta fase. Só ofereça F1 quando a fase
  // realmente pedir sub-rotina — botão a mais só atrapalha.
  comandosDisponiveis: ["AVANCAR", "GIRAR_ESQ", "GIRAR_DIR", "PULAR", "ACENDER", "F1"],

  // Limites de comandos. "tres" é a sua solução ótima; "duas" é a folga.
  // Regra prática: duas = tres + 2 ou 3.
  estrelas: { duas: 12, tres: 9 },

  // Aparece quando o aluno aperta "Dica". Empurre o raciocínio, não entregue
  // a resposta pronta.
  dica: "Repare que os dois lados do caminho são iguais."
}
```

### Depois de criar a fase — não pule esta parte

1. Abra `test/solucoes.test.js`.
2. Acrescente a sua solução no objeto `SOLUCOES`, usando os atalhos do topo do
   arquivo (`A` = avançar, `E` = girar esq, `D` = girar dir, `P` = pular,
   `L` = acender):

```javascript
13: { principal: ["F1", "F1"], f1: [A, A, A, L, D] },
```

3. Rode:

```bash
node test/solucoes.test.js
```

O teste confere que a sua solução cabe nos espaços, só usa comandos que estão
na paleta, **realmente vence** quando executada no motor de verdade, e vale as
três estrelas. É o que impede uma fase impossível de chegar na frente da turma.

### Como trocar o nome do jogo

Abra `js/config.js` e mude a primeira linha:

```javascript
const NOME_JOGO = "AlgoBot";
```

O nome novo aparece no título da janela, no cabeçalho e na tela de boas-vindas.

## O jogo publicado

O jogo está no ar em:

**https://gerbison.github.io/Algobot/**

Atenção ao endereço: o GitHub diferencia maiúsculas de minúsculas na URL, e o
repositório se chama `Algobot`, com `A` maiúsculo e `b` minúsculo.

Repositório: `github.com/Gerbison/Algobot`, **público** — o Pages não atende
repositório privado no plano gratuito do GitHub, por isso a visibilidade foi
aberta. Não há nada sensível no código: sem senha, sem chave de API, sem dado
de aluno.

### Como atualizar o que está no ar

Não existe build step: publicar é só empurrar os arquivos.

```bash
git push origin main
```

Um ou dois minutos depois o site já reflete a mudança. Se o navegador insistir
em mostrar a versão antiga, force a recarga com `Ctrl+F5`.

### Como isso foi ligado

Em **Settings → Pages**, com *Deploy from a branch*, branch `main`, pasta
`/ (root)`. Se algum dia o site sumir, é o primeiro lugar a conferir.

### Se você for criar outro repositório do zero

Crie vazio no GitHub — **sem** marcar README, `.gitignore` ou licença, senão
ele conflita com os commits que já existem aqui. Depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
```

```bash
git push -u origin main
```

## Painel do professor

Ainda não existe — é a **Entrega 3**. O que já está pronto para ele:

- O jogo gera um **código de conclusão** (botão *Meu código*), no formato
  `ALG-XXXXX-XXXX`, que carrega as estrelas de todas as fases.
- A função `Estrelas.decodificarCodigo()` lê esse código de volta.
- A função `Estrelas.conferirNome(codigo, nome)` diz se o código foi gerado por
  alguém que digitou aquele nome — serve para impedir que um aluno entregue o
  código do colega.

Por enquanto, para acompanhar a turma sem internet: peça o código na saída da
aula e guarde junto com o nome.

## Quando der problema

**O jogo abre mas o tabuleiro fica preto.**
Provavelmente algum arquivo não veio junto. Confira que existem as pastas `css/`
e `js/` ao lado do `index.html`. Abra o console do navegador (F12) e veja se há
erro de arquivo não encontrado.

**O progresso sumiu.**
O progresso mora no `localStorage`, que é por navegador e por computador. Aba
anônima não guarda nada; trocar de máquina ou de navegador começa do zero. Em
PC de escola com perfil que reseta no logoff, o progresso também se perde — é
para isso que serve o código de conclusão.

**Arrastar não funciona no mouse da escola.**
Use o clique: clicar no comando joga ele no primeiro espaço livre da área
destacada em amarelo. Clicar num comando já colocado remove.

**O navegador travou numa fase com F1.**
Não deveria: existe um limite de 200 chamadas empilhadas e outro de 5000 passos.
Se travou mesmo assim, é bug — anote a fase e o que estava nas áreas.

**Mudei uma fase e ela ficou impossível.**
Rode `node test/solucoes.test.js`. Se a mensagem falar em "espaços", a solução
não cabe; se falar em alvos apagados, o caminho não fecha; se falar em estrelas,
os limites de `estrelas` estão apertados demais para a própria solução.

**Quero apagar tudo e recomeçar.**
Botão *Fases* → *Apagar meu progresso*.
