# Publica o site: testa aqui e envia para o GitHub. Quem gera e publica é o GitHub Actions (.github/workflows/site.yml).
# Uso (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Mensagem "Corrige a wing 3"
# Sem mudança nova para registrar, só envia o que já está commitado.
# PDFs completos (sob demanda):  .\publicar.ps1 -ComPdf   (pede ao Actions uma publicação com PDF)
# Pular os testes locais (o Actions roda de novo de qualquer jeito):  -SemTeste
# Primeira vez neste computador: gh auth login --web
param([string]$Mensagem, [string]$Corpo, [switch]$ComPdf, [switch]$SemTeste)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if ((git branch --show-current) -ne 'main') { throw 'Você não está na branch main. Rode: git switch main' }
if (git status --porcelain) {
  if (-not $Mensagem) { throw 'Há mudanças sem commit. Diga o que mudou com -Mensagem "Título" (o histórico é público).' }
}

if (-not $SemTeste) {
  Push-Location site-astro
  try {
    if (-not (Test-Path node_modules)) { & npm ci; if ($LASTEXITCODE) { throw 'npm ci falhou; nada foi publicado.' } }
    Write-Host '1/3  Gerando o site...' -ForegroundColor Cyan
    & npm run build; if ($LASTEXITCODE) { throw 'A build falhou; nada foi publicado.' }
    & npm run pdf-aviso; if ($LASTEXITCODE) { throw 'Os PDFs de aviso falharam; nada foi publicado.' }
    Write-Host '2/3  Rodando os testes...' -ForegroundColor Cyan
    & npm run qa; if ($LASTEXITCODE) { throw 'Os testes falharam; nada foi publicado.' }
  } finally { Pop-Location }
}

Write-Host '3/3  Enviando para o GitHub...' -ForegroundColor Cyan
if (git status --porcelain) {
  git add -A
  if ($Corpo) { git commit -q -m $Mensagem -m $Corpo } else { git commit -q -m $Mensagem }
  if ($LASTEXITCODE) { throw 'O commit falhou.' }
}
# traz os pull requests que entraram pelo GitHub desde o último envio
git pull --rebase origin main
if ($LASTEXITCODE) { throw 'Seu commit conflita com algo que entrou no GitHub. Resolva o conflito e rode de novo.' }
git push origin main
if ($LASTEXITCODE) { throw 'O push falhou (veja a mensagem acima).' }

if ($ComPdf) {
  & gh workflow run site.yml --ref main -f pdf=true
  if ($LASTEXITCODE) { throw 'Não consegui pedir a publicação com PDF.' }
}
Write-Host 'Enviado. O GitHub leva de 2 a 5 minutos para testar e publicar: https://github.com/divinegw/divinegw.github.io/actions' -ForegroundColor Green
