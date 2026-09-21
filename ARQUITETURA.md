# AlgoBot — Arquitetura (Entrega 1)

Este documento explica **o que foi construído e por quê**. Se você voltar aqui
daqui a seis meses, comece por ele.

## O que é

Um jogo de lógica de programação do gênero "robô em grade": o aluno monta uma
fila de comandos, aperta *Executar*, e o robô percorre um tabuleiro isométrico
tentando acender todas as casas-alvo. O objetivo pedagógico é fazer o aluno
descobrir sozinho **sub-rotina** e **reuso de código** — não porque alguém
explicou, mas porque a fase não cabe na área PRINCIPAL.

Obra original inspirada no gênero. Nenhuma arte, som, nome ou fase de jogo
existente foi usada; todo o visual é desenhado por código no Canvas.

## Restrições que moldaram tudo

- **Abre com duplo clique** (`file://`), sem servidor. Por isso: nenhum
  `import`/`export`, nenhum `fetch()`, nenhum `npm`. Só `<script src>` clássico
  e dados embutidos em objetos JavaScript.
- **Sem build step e sem framework.** HTML, CSS e JS puro.
- **Zero rede.** Nenhuma requisição externa, nenhum rastreamento, nenhuma
  propaganda. O jogo funciona com o cabo de rede arrancado.
- **PC de escola.** 1366x768, mouse ruim. Daí os slots e botões grandes e o
  fato de *clicar* funcionar tão bem quanto *arrastar*.

## Os arquivos

```
index.html          estrutura da tela e a ordem dos <script>
css/estilo.css      todo o visual da interface (o tabuleiro é Canvas, não CSS)
js/config.js        constantes: nome do jogo, cores, velocidades, limites
js/fases.js         as 22 fases  ← é aqui que o professor mexe
js/motor.js         as regras do jogo (mover, girar, pular, acender)
js/interpretador.js decide qual comando vem a seguir; pilha de chamadas F1/F2
js/estrelas.js      pontuação e código de conclusão
js/codigo.js        traduz a solução para TypeScript e comenta o que o aluno fez
js/guia.js          guia dos comandos na coluna da esquerda (textos + exemplos)
js/captura.js       monta a imagem PNG da fase para o aluno enviar
js/storage.js       fachada de persistência (hoje só localStorage)
js/render.js        desenho isométrico no Canvas
js/ui.js            a cola: DOM, arrastar/clicar, execução animada, janelas
test/solucoes.test.js  regressão das fases, roda no Node sem navegador
test/otimo.js       busca por força bruta o menor programa que resolve uma fase
test/render.test.js confere a ordem de desenho e o pulo em todos os passos
test/captura.test.js confere o link "mailto:" do botão Enviar por e-mail
test/solucoes-conhecidas.js  a solução pretendida de cada fase (usada pelos testes)
```

A ordem dos `<script>` em `index.html` importa: `config.js` primeiro (todo mundo
usa suas constantes), `ui.js` por último.

## Como os dados fluem

```
clique ou arraste do aluno
        ↓
programa = { principal: [...], f1: [...], f2: [...] }     (ui.js)
        ↓
Interpretador.proximaInstrucao()  → "o próximo é AVANÇAR, slot 3 da F1"
        ↓
Motor.aplicar(estado, comando)    → muda estado.robo / estado.acesos
        ↓
Render.desenhar(estado, visual)   → pinta o Canvas (60 fps, requestAnimationFrame)
        ↓
Motor.venceu(estado) === true
        ↓
Estrelas.calcular()  →  Storage.registrarConclusao()  →  localStorage
```

Cada camada só conhece a de baixo. `motor.js` não sabe que existe tela;
`render.js` não sabe que existe aluno; `interpretador.js` não sabe o que
os comandos fazem. Isso é o que torna o teste em Node possível: ele
importa motor + interpretador e joga as fases sem navegador nenhum.

## As três decisões que valem explicação

### 1. A pilha de chamadas é feita à mão

`F1` e `F2` podem chamar a si mesmas. Se o interpretador usasse recursão de
verdade do JavaScript, um laço infinito do aluno estouraria a pilha do
navegador e travaria a aba — na frente da turma.

Então `interpretador.js` mantém a pilha num array comum:

```javascript
pilha = [ { area: "principal", indice: 4 }, { area: "f1", indice: 2 } ]
```

Quando ela passa de `LIMITE_PILHA` (200), a execução para com a mensagem
"O robô se perdeu em um laço infinito". Existe ainda um segundo freio,
`MAX_PASSOS` (5000), para o caso de o robô andar em círculo sem recursão.

**Não há eliminação de chamada de cauda de propósito.** Ela deixaria o laço
recursivo rodar para sempre sem nunca estourar a pilha — e aí o freio de
segurança não freia nada. O preço é que uma solução recursiva legítima gasta um
nível de pilha por repetição; com limite 200 sobra folga de sobra para as fases
que existem.

### 2. A vitória interrompe o programa

Assim que o último alvo acende, a fase termina — o robô não precisa chegar ao
fim da lista de comandos. Isso não é um detalhe: nas fases 9, 10 e 12 a `F1`
chama a si mesma e o programa **nunca terminaria sozinho**. É a vitória que
serve de condição de parada do laço, e é exatamente essa a ideia que se quer
ensinar ali.

### 3. Projeção isométrica

A conversão está comentada em `render.js`, mas o resumo é:

```
telaX = (x - y) * (LARGURA_TILE / 2)
telaY = (x + y) * (ALTURA_TILE / 2) - altura * ALTURA_NIVEL
```

A ordem de desenho é o pulo do gato: a profundidade das casas é `x + y`, e
pintar da menor para a maior já desenha de trás para frente. O robô é o caso
difícil — entre duas casas, e às vezes atrás de paredes — e tem a própria
seção, a 8.

O enquadramento (`Render.enquadrar`) mede o tabuleiro inteiro e calcula
deslocamento e escala para ele caber no canvas. Por isso uma fase 8x8 e uma 4x4
aparecem ambas centralizadas e do tamanho certo, sem número mágico nenhum.

### 3b. Girar a câmera

O aluno pode girar o tabuleiro (botões ↺ ↻ ou teclas Q e E) para ver o que uma
casa alta está escondendo. Em vez de escrever quatro projeções, giramos as
**coordenadas** em torno do centro do tabuleiro e aplicamos sempre a mesma
projeção:

```
p' = centro + R(θ) · (p - centro)
```

Duas consequências de fazer assim: θ pode ser um valor qualquer, então o giro
fica animado só interpolando θ; e, como o giro é em torno do centro, o
tabuleiro nunca escapa da tela.

Isso obrigou a mudar a ordem de desenho. Com as coordenadas giradas, a
profundidade `x + y` não segue mais a ordem das linhas da matriz, então o
laço aninhado deixou de bastar: agora montamos a lista de tudo que vai ser
desenhado (casas **e** o robô) e ordenamos a cada quadro (seção 8).
São no máximo 64 casas; ordenar isso 60 vezes por segundo não custa nada, e é
muito mais fácil de conferir do que deduzir o laço certo para cada ângulo.

`Render.enquadrar` mede a **união das quatro orientações**, não só a atual. Se
medisse só a atual, um tabuleiro não quadrado (a fase 9 é 8x4) mudaria de
escala no meio do giro e a imagem ficaria "respirando".

**A câmera é puramente visual.** O motor continua raciocinando em NORTE/SUL/
LESTE/OESTE do tabuleiro; nenhum comando muda de efeito porque a vista girou.
O visor do robô gira junto com a câmera — o vetor da direção é girado pelo
mesmo θ antes de ser projetado —, então o que o aluno vê continua batendo com
o que vai acontecer.

### 4. A revisão em TypeScript

Ao vencer, `codigo.js` traduz a solução do aluno para TypeScript e escreve uma
frase sobre o que ele fez. A análise é deliberadamente rasa — quatro casos, na
ordem em que são testados:

1. **alguma sub-rotina chama a si mesma** → é recursão; a alternativa mostra o
   mesmo laço escrito com `while`;
2. **a PRINCIPAL é um bloco repetido do início ao fim** → vira um `for`. Se o
   bloco repetido já for uma chamada de sub-rotina, só falta o laço; se o aluno
   repetiu os comandos na mão, a sugestão extrai uma função **e** usa o laço;
3. **usou sub-rotina, sem repetição exata** → explica o que é uma função, sem
   sugerir alternativa;
4. **sequência direta** → diz que não há o que encurtar.

Duas decisões que valem registrar:

- **Só a repetição que cobre a lista inteira conta** (`Codigo.repeticao`).
  Repetição parcial existiria em quase todo programa e a sugestão viraria
  ruído. Melhor não sugerir nada do que sugerir algo confuso.
- **A alternativa fala de como escrever, nunca de qual é a resposta.** A graça
  do jogo é o aluno achar o caminho; o que este arquivo ensina é a forma de
  expressar o caminho em código. Se algum dia alguém quiser mostrar a solução
  ótima aqui, saiba que isso mata o valor pedagógico das fases 5 e 6.

`codigo.js` não conhece o motor nem o DOM: recebe o programa, devolve texto.
Por isso os quatro casos são testados no Node, sem navegador. O realce de
sintaxe (que é HTML) mora em `ui.js`, junto com o escape — o gerador continua
produzindo texto puro.

### 5. O guia dos comandos

`guia.js` monta a coluna da esquerda a cada troca de fase. O conteúdo (textos e
exemplos antes/depois) é um objeto de dados, `CONTEUDO`, separado do código que
desenha — para mudar uma explicação não é preciso entender o DOM.

- **Ordem:** comandos da fase primeiro, com F1/F2 no topo quando existem (são o
  assunto das fases 5 em diante); depois os que a fase não oferece, apagados.
  O rótulo é "Não usados nesta fase", e não "próximas fases", porque o PULAR
  aparece na fase 4 e some na 5.
- **Exemplos em vista de cima**, com caixinhas em CSS, e não isométricos: o
  guia explica a ideia do comando e não deve disputar atenção com o tabuleiro.
- **Recolher o guia** é uma preferência de tela, guardada por
  `Storage.lerPreferencia/salvarPreferencia` numa chave própria
  (`algobot.preferencias.v1`), separada do progresso: não entra no código de
  conclusão nem deve ir para a nuvem na Entrega 2. Ao recolher/abrir, o canvas
  é reenquadrado, porque a coluna do tabuleiro muda de largura.
- **Teste:** `solucoes.test.js` confere que todo comando usado em alguma fase
  tem cartão, texto, exemplo e está em `Guia.ORDEM`.

A 1366x768 as três colunas ficam guia 270px + tabuleiro ~640px + programação
400px. O guia rola por dentro; a página continua sem rolagem.

### 6. A captura da fase

`captura.js` monta a imagem num canvas à parte (cabeçalho, cópia do
tabuleiro, programa desenhado em fichas, rodapé com a situação), em vez de
"fotografar" a página. O navegador não deixa uma página tirar print de si
mesma sem biblioteca externa, e o jogo não usa nenhuma; montando à parte, a
imagem também sai igual em qualquer tamanho de tela.

Três detalhes que já deram problema e estão tratados:

- **O tabuleiro é redesenhado na hora da captura.** O desenho normal roda no
  `requestAnimationFrame`, que o navegador pausa com a aba fora de vista; logo
  depois de uma troca de fase o canvas pode estar vazio, e a captura saía sem
  tabuleiro.
- **Os botões ficam desligados até o PNG ficar pronto.** Converter a imagem leva
  cerca de 1 segundo num PC modesto; antes disso, clicar em *Baixar* não fazia
  nada, o que parecia defeito.
- **As estrelas só aparecem se valem para o programa montado.** `resultadoAtual`
  é zerado sempre que um comando entra ou sai, na troca de fase, ao limpar e ao
  executar de novo.

*Copiar imagem* e *Compartilhar…* usam APIs que só existem em página segura
(https ou localhost). Aberto por `file://` esses dois botões são escondidos em
vez de falhar.

#### "Enviar por e-mail": por que não é a mesma coisa que "Compartilhar…"

O botão original era só *Compartilhar…*, sobre `navigator.share` com o arquivo
anexado. Ele funciona bem no celular, mas em desktop `navigator.canShare` quase
sempre devolve `false` para arquivos — o botão simplesmente não aparecia no
Chrome/Edge de PC, e foi relatado como "o botão de e-mail não funciona".

A troca foi por um link `mailto:`, montado por `Captura.linkEmail()` (função
pura, sem DOM, testada em `test/captura.test.js`). Duas coisas que valem
registrar:

- **`mailto:` não anexa arquivo.** Não é uma limitação deste código — nenhum
  site consegue anexar um arquivo a um e-mail por segurança do navegador.
  A solução foi baixar o PNG automaticamente antes de abrir o e-mail, e o
  corpo da mensagem lembra o aluno de anexar o arquivo baixado, citando o nome
  exato dele.
- **O endereço do destinatário não é passado por `encodeURIComponent`.**
  Só o assunto e o corpo são codificados; o endereço vai puro no `mailto:`,
  porque um `%40` no lugar do `@` confunde alguns clientes de e-mail mais
  antigos.

`EMAIL_PROFESSOR`, em `js/config.js`, é o único lugar a mudar para outro
professor usar o jogo. `Compartilhar…` continua existindo como opção extra —
só aparece quando o navegador realmente suporta enviar arquivo, o que é comum
no celular.

### 7. As 22 fases e a calibragem das estrelas

As fases 13 a 22 foram acrescentadas depois que a turma terminou as 12 primeiras
em menos de 25 minutos. Nada de comando novo: as ideias novas saem de combinar
os mesmos sete.

O limite de 3 estrelas só vale alguma coisa se for mesmo o menor programa
possível. Por isso existe `test/otimo.js`: ele experimenta, em ordem crescente
de tamanho, **todos** os programas que cabem nos espaços da fase, e para no
primeiro que vence — o que encontra é, por construção, o mínimo.

Ele reimplementa as regras do motor de forma enxuta (inteiros em vez de objetos)
para caber no orçamento de tempo. Isso é duplicação de regra, e é o risco
conhecido deste arquivo: se `motor.js` mudar, `otimo.js` precisa mudar junto.
A conferência é o `solucoes.test.js`, onde toda solução conhecida também precisa
vencer.

Força bruta cresce rápido: até 9 comandos a busca termina em segundos ou
minutos; acima disso o script desiste e não afirma nada. Situação em 17/09/2026:

- **Mínimo provado** (a busca achou a solução, e ela tem o tamanho do limite):
  fases 1, 2, 5, 9, 10, 13, 15, 17, 18 e 19.
- **Mínimo provado por exclusão**: fase 21. A busca varreu tudo até 9 comandos
  sem achar solução, e existe uma de 10 — logo 10 é o mínimo.
- **Não provado**: fases 14, 16, 20 e 22, cujas soluções têm 11 a 15 comandos.
  Sabemos apenas que não existe solução com até 9. O limite vem da solução
  conhecida.

Se um aluno achar algo menor do que o limite, ganha as 3 estrelas do mesmo
jeito — o limite é "até N", não "exatamente N".

A busca de uma fase com 7 comandos na paleta e 9 de orçamento leva de 2 a 9
minutos. Rode em segundo plano.

### 8. O robô entre duas casas: ordem de desenho e pulo

**O bug.** O robô recebia um número de profundidade igual ao x + y da posição
*interpolada*. No meio de um passo entre uma casa de profundidade 3 e outra de
4, ficava com 3,5 — e a casa 4 era pintada por cima dele. Medido em pixels no
navegador: até **52% do robô sumia** num passo comum no plano, e **100%** na
queda da fase 18.

**Por que um número só não resolve.** Primeira tentativa: usar o maior x + y
entre origem e destino. Resolveu o plano, mas a medição mostrou dois efeitos
novos. Na fase 16 o destino e o muro ao lado têm o mesmo x + y, então o robô
passou a aparecer na frente do muro. E, com a câmera girada, a casa de onde o
robô sai pode estar à frente dele, e qualquer ponto em que ele fosse encaixado
na lista errava ou essa casa ou um muro.

**Como ficou** (`Render.ordemDeDesenho`):

- O robô é uma pequena área no chão (±0,3 casa), comparada com a área de cada
  casa. Casa inteira à frente → pintada depois (é parede). Inteira atrás →
  antes.
- Casas do passo (origem e destino): se o corpo do robô está na altura do topo
  dela ou acima, ele está sobre ela e é pintado por cima — nunca atravessa o
  chão. Se o topo está acima do robô *e* a casa está à frente, ela é parede
  naquele instante. É o que faz o robô sumir aos poucos atrás da torre na
  queda da fase 18, em vez de sumir de uma vez ao pousar.
- A ordem final é uma ordenação topológica (Kahn): uma casa só precisa vir
  antes de outra se as duas se sobrepõem na tela. Isso dá liberdade para o robô
  ficar por cima da casa de onde saiu e por baixo do muro ao mesmo tempo.
- A elevação **não** entra na profundidade: toda casa é uma coluna até o
  chão, e uma coluna à frente continua à frente por mais alto que o robô esteja.

**O pulo** (`Render.interpolar`): quando as duas casas têm alturas diferentes,
a altura do robô segue `reta + k·4s(1−s)` — uma parábola somada à reta entre as
alturas, com `k = 0,6 + 0,25·|desnível|`. A condição é só a diferença de altura,
não o comando, então vale para qualquer mudança de nível em qualquer fase. A
sombra fica no chão da casa que está debaixo do robô e encolhe enquanto ele está
no ar.

**Como foi verificado.**

- No navegador, contando pixels do robô a cada quadro, em todos os passos das
  soluções das 22 fases, nas 4 posições de câmera. O pior salto de visibilidade
  entre quadros seguidos caiu de 100% para 11%. Os saltos que sobram são o
  robô entrando ou saindo de trás de uma parede de forma contínua: medindo com
  6 vezes mais quadros, eles diminuem na mesma proporção, o que um estalo não
  faria.
- `test/render.test.js`, sem navegador: 83 mil verificações das regras
  acima nos mesmos passos, câmeras e 21 instantes por passo. Foi testado contra
  o próprio erro: quebrar a regra do chão produz 42 mil falhas, e quebrar a
  regra da parede produz 753.

**O que ainda pode aparecer.** Na subida para um bloco mais alto que está à
frente, o robô começa escondido atrás dele e aparece quando o pulo passa da
altura do topo. Essa passagem acontece num quadro só, mas é pequena (cerca de
7% do corpo por quadro) porque os pés estão bem na borda do bloco. É o limite do
algoritmo do pintor (desenhar de trás para frente), que não recorta um desenho
pela metade.

## O código de conclusão

Formato: `ALG-XXXXX-XXXX`.

- O **primeiro bloco** carrega as estrelas de cada fase, 2 bits por fase, em
  base32.
- O **segundo bloco** é um resumo (hash FNV-1a) do nome digitado.

O alfabeto base32 não tem `I`, `L`, `O` nem `U`, para o aluno não confundir
`1`/`I` e `0`/`O` ao ditar o código em voz alta.

**O nome não volta a partir do código** — ele é curto demais para isso. O que o
painel do professor consegue fazer é *conferir* se um nome que ele já tem na
lista de chamada bate com o código, o que resolve o problema real: impedir que
um aluno entregue o código do colega. A função `Estrelas.conferirNome()` já
está pronta para a Entrega 3.

**Pegadinha conhecida:** o preenchimento com zeros no fim pode fazer o código
devolver até duas fases a mais do que existiam, sempre com 0 estrelas. O painel
do professor precisa cortar a lista no total de fases que ele conhece.

## Onde isso pode te morder depois

- **`Storage` é a única costura para a Entrega 2.** Se algum código novo chamar
  `localStorage` diretamente, a sincronização com a nuvem vai ter que ser
  reescrita em vários lugares. Mantenha tudo passando por `storage.js`.
- **Estrela conta comandos escritos, não executados.** Uma fase pode ser
  vencida com 4 comandos que rodam 200 vezes. É de propósito — é o que premia
  o reuso —, mas não confunda com "eficiência de execução" ao explicar em aula.
- **`fase.espacos` é o que força o aprendizado.** Se você aumentar a PRINCIPAL
  das fases 5 e 6 "para o aluno não sofrer", elas deixam de ensinar sub-rotina,
  porque a solução em linha reta volta a caber.
- **Os limites de estrela são conferidos pelo teste.** `test/solucoes.test.js`
  guarda a solução pretendida de cada fase e falha se ela não valer 3 estrelas.
  Se você mudar um tabuleiro sem mudar a solução do teste, o teste acusa.
- **Nomes de identificadores em português com acento** existem em textos, mas
  não em nomes de variáveis. Evite criar novos com acento: alguns editores e
  ferramentas antigas ainda tropeçam.

## O que ficou de fora, de propósito

- **Som.** Nada de áudio na Entrega 1 — laboratório de escola com 30 máquinas
  tocando bipe é insuportável.
- **Desfazer/refazer.** O aluno limpa e refaz; a fila é curta.
- **Reordenar comandos arrastando de um slot para outro.** Hoje se arrasta da
  paleta para o slot, e clique remove. Reordenação interna adicionaria uma
  camada de estado de arraste que não paga o custo agora.
- **Editor de fases na tela.** Fase nova se cria editando `fases.js`. Ver
  `MANUAL.md`.
- **Qualquer coisa de rede.** Login, nuvem e painel do professor são as
  Entregas 2 e 3.

## Testes

```bash
node test/solucoes.test.js
```

Para cada uma das 12 fases o teste confere que a solução pretendida (a) cabe
nos espaços oferecidos, (b) só usa comandos que estão na paleta daquela fase,
(c) realmente vence quando executada no motor de verdade e (d) vale as três
estrelas. Também testa ida e volta do código de conclusão e a detecção de laço
infinito.

Rode isso **sempre** depois de mexer em `fases.js`. É o que impede uma fase
impossível de chegar na frente da turma.
