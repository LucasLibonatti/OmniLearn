$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')
Set-Location $root

$fails = 0
$warns = 0

function Pass($msg) { Write-Host "[PASS] $msg" -ForegroundColor Green }
function Warn($msg) { $script:warns++; Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Fail($msg) { $script:fails++; Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host "`n=== OmniLearn Release & Portfolio QA ===" -ForegroundColor Cyan

# 1. Unit tests (Vitest)
npm test | Out-Host
if ($LASTEXITCODE -eq 0) { Pass "Testes unitarios (Vitest) passaram" }
else { Fail "Testes unitarios falharam (exit code $LASTEXITCODE)" }

# 2. TypeScript + Vite build
npm run build | Out-Host
if ($LASTEXITCODE -eq 0) { Pass "TypeScript check e Vite build concluidos sem erros" }
else { Fail "Build falhou (exit code $LASTEXITCODE)" }

# 2. Bundle size budget (nenhum chunk de rota deve exceder 150 KB)
$heavyRouteChunks = Get-ChildItem "$root\dist\assets\*.js" -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch '^(react|pdf|jszip|index)-' -and $_.Length -gt 150KB }
if ($heavyRouteChunks) {
  foreach ($chunk in $heavyRouteChunks) {
    $kb = [math]::Round($chunk.Length / 1KB, 1)
    Fail "Chunk de rota acima do limite ($($chunk.Name): $kb KB > 150 KB)"
  }
} else {
  $largest = Get-ChildItem "$root\dist\assets\*.js" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notmatch '^(react|pdf|jszip|index)-' } |
    Sort-Object Length -Descending | Select-Object -First 1
  if ($largest) {
    $kb = [math]::Round($largest.Length / 1KB, 1)
    Pass "Todos os chunks de rota dentro do orcamento (maior: $($largest.Name) = $kb KB <= 150 KB)"
  }
}

# 3. Heavy image check
$heavyImgs = Get-ChildItem "$root\Icons","$root\public" -Recurse -File -Include *.png,*.jpg,*.jpeg,*.webp -ErrorAction SilentlyContinue |
  Where-Object { $_.Length -gt 150KB }
if ($heavyImgs) {
  foreach ($img in $heavyImgs) {
    $kb = [math]::Round($img.Length / 1KB, 1)
    Warn "Imagem pesada ($kb KB): $($img.FullName.Replace("$root\",''))"
  }
} else {
  Pass "Todas as imagens estao otimizadas (<= 150 KB)"
}

# 4. Dead placeholders / leaked paths / raw i18n keys in tr()
$srcFiles = Get-ChildItem "$root\src" -Recurse -File -Include *.ts,*.tsx
$deadLinks = $srcFiles | Select-String -Pattern 'href=["'']#["'']'
if ($deadLinks) { Warn "Encontrados links mortos href='#' ($($deadLinks.Count) ocorrencias)" }
else { Pass "Nenhum link morto href='#' encontrado em src/" }

$todos = $srcFiles | Select-String -CaseSensitive -Pattern '\b(TODO|FIXME)\b|TAREFA \d+'
if ($todos) { Warn "Comentarios pendentes (TODO/FIXME/TAREFA): $($todos.Count) ocorrencias" }
else { Pass "Nenhum comentario TODO/FIXME/TAREFA pendente em src/" }

$rawTr = $srcFiles | Select-String -Pattern "tr\(['""][a-z]+\.[a-z]+\."
if ($rawTr) { Fail "Possivel chave i18n crua passada para tr() em vez de t(): $($rawTr.Path -join ', ')" }
else { Pass "Nenhuma chave i18n crua detectada em chamadas tr()" }

# 5. Portfolio files
if (Test-Path "$root\LICENSE") { Pass "Arquivo LICENSE encontrado" }
else { Warn "Arquivo LICENSE (MIT) ainda nao existe na raiz do repositorio" }

if (Select-String -Path "$root\README.md" -Pattern 'VITE_GROQ_API_KEY' -Quiet) {
  Warn "README.md ainda referencia VITE_GROQ_API_KEY (a chave real fica apenas no backend/Edge Function)"
} else {
  Pass "README.md sem referencia incorreta a VITE_GROQ_API_KEY"
}

if (Select-String -Path "$root\README.md" -Pattern 'https://www\.linkedin\.com/\)' -Quiet) {
  Warn "README.md possui link generico do LinkedIn (https://www.linkedin.com/)"
} else {
  Pass "Link do LinkedIn no README.md configurado"
}

# 6. Dependency security audit
Write-Host "`n--- npm audit (prod) ---" -ForegroundColor Cyan
npm audit --omit=dev --audit-level=high | Out-Host
if ($LASTEXITCODE -eq 0) { Pass "npm audit (prod) sem vulnerabilidades high/critical" }
else { Warn "npm audit reportou vulnerabilidades — revise com 'npm audit'" }

Write-Host "`nResumo: $fails falha(s), $warns aviso(s)." -ForegroundColor Cyan
if ($fails -gt 0) { exit 1 }
exit 0
