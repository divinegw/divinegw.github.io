# Como ligar a inscrição online do sorteio

A aba **Inscrição online** do `/sorteio.html` e os links de inscrição (`/sorteio.html?s=...`) dependem de um projeto no Firebase, o serviço do Google que guarda as inscrições. O plano grátis (Spark) dá e sobra para a guilda, não pede cartão e não pausa quando fica parado.

Leva uns 15 minutos. Você só faz isso uma vez.

## 1. Criar o projeto

1. Entre em [console.firebase.google.com](https://console.firebase.google.com) com a conta Google que vai cuidar do sorteio.
2. Clique em **Criar um projeto** (ou **Adicionar projeto**) e dê um nome, por exemplo `divine-sorteio`.
3. O Google Analytics não é necessário: pode desligar.

## 2. Criar o banco de dados

1. No menu da esquerda, abra **Criação > Firestore Database** e clique em **Criar banco de dados**.
2. Escolha a região `southamerica-east1 (São Paulo)`. Depois de criado, não dá para mudar a região.
3. Escolha **Iniciar no modo de produção**.
4. Abra a aba **Regras**, apague o que estiver lá, cole o conteúdo inteiro de `site-astro/firebase/firestore.rules` e clique em **Publicar**.

## 3. Ligar o login dos organizadores

1. No menu, abra **Criação > Authentication**, clique em **Vamos começar** e escolha **Google**. Ative, escolha o e-mail de suporte e salve.
2. Na aba **Configurações > Domínios autorizados** do Authentication, clique em **Adicionar domínio** e coloque `divinegw.github.io`. O `localhost` já vem na lista.

## 4. Pegar a configuração do site

1. Clique na engrenagem ao lado de **Visão geral do projeto** e abra **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone **</>** (Web), dê um nome (`site`) e clique em **Registrar app**. Não precisa marcar o Hosting.
3. Vai aparecer um bloco `const firebaseConfig = { ... }`. Copie os valores de `apiKey`, `authDomain`, `projectId` e `appId` e mande para mim, ou cole em `site-astro/src/sorteio.ts` assim:

```ts
export const FIREBASE = {
  apiKey: '...',
  authDomain: '....firebaseapp.com',
  projectId: '...',
  appId: '...',
};
```

Esses valores não são segredo. O Firebase foi feito para eles ficarem no site, e quem protege os dados são as regras do passo 2.

## 5. Virar organizador

1. Rode o site (ou publique) e abra **Sorteio > Inscrição online**.
2. Clique em **Entrar com Google**. O site vai dizer que a sua conta ainda não é de organizador e mostrar um código. Copie esse código.
3. No console do Firebase, abra **Firestore Database > Dados** e clique em **Iniciar coleção**. Em **ID da coleção**, ponha `admins`.
4. Em **ID do documento**, cole o código que você copiou. Adicione um campo `nome` (tipo string) com o seu nome e salve.
5. Recarregue a página do sorteio. Pronto, o painel do organizador aparece.

Para liberar outra pessoa, peça o código dela (ela faz o passo 2) e crie mais um documento em `admins` com esse código.

## Como funciona depois

- Você cria o sorteio na aba **Inscrição online**, e o link já vai copiado. Cole no Discord.
- Cada pessoa abre o link e põe a própria conta (`Nome.1234`). O site aceita uma inscrição por conta.
- A lista de inscritos fica visível para quem tem o link. É ela que deixa todo mundo conferir o resultado.
- Para deixar só quem é da guilda, cole a chave de API do líder em **Deixar só membros da guilda**. Quem não é da guilda aparece riscado e fica de fora.
- Ao clicar em **Sortear agora**, as inscrições fecham e o resultado aparece na hora para todo mundo que está com o link aberto, junto com o código para conferir.

## Limites do plano grátis

São 50 mil leituras e 20 mil gravações por dia. Um sorteio com 200 inscritos usa poucos milhares. Se um dia passar do limite, o sorteio para até a meia-noite do horário do Pacífico (umas 4h ou 5h da manhã no Brasil) e volta sozinho. Não tem cobrança.
