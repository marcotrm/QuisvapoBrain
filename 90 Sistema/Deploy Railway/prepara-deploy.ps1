# Prepara la cartella di deploy per Railway: copia SOLO il vault (niente codice SvaPro)
# in C:\Users\Utente\Desktop\QuisvapoBrain-deploy, pronta per "git push" verso il repo di deploy.
# Rilanciarlo aggiorna la copia (le modifiche locali al vault vengono riportate nel deploy).
$ErrorActionPreference = 'Stop'

$vault = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # root del vault (…\SvaPro)
$dest  = "C:\Users\Utente\Desktop\QuisvapoBrain-deploy"

$folders = '00 Inbox','10 Clienti','20 Progetti','30 Aree','40 Risorse','50 Conversazioni','60 Negozi','70 Idee','90 Sistema'
$files   = 'CLAUDE.md','Home.md'

New-Item -ItemType Directory -Force -Path $dest | Out-Null

foreach ($f in $folders) {
  robocopy (Join-Path $vault $f) (Join-Path $dest $f) /MIR /NFL /NDL /NJH /NJS | Out-Null
}
foreach ($f in $files) { Copy-Item (Join-Path $vault $f) $dest -Force }

# .claude: agenti, skills, settings (niente cache o file di sessione)
New-Item -ItemType Directory -Force -Path "$dest\.claude" | Out-Null
robocopy "$vault\.claude\agents" "$dest\.claude\agents" /MIR /NFL /NDL /NJH /NJS | Out-Null
robocopy "$vault\.claude\skills" "$dest\.claude\skills" /MIR /NFL /NDL /NJH /NJS | Out-Null
Copy-Item "$vault\.claude\settings.json" "$dest\.claude\" -Force
Copy-Item "$vault\.claude\launch.json" "$dest\.claude\" -Force

# Dockerfile e .dockerignore nella root del repo di deploy
Copy-Item "$vault\90 Sistema\Deploy Railway\Dockerfile" $dest -Force
Copy-Item "$vault\90 Sistema\Deploy Railway\dockerignore.txt" "$dest\.dockerignore" -Force

# .gitattributes: gli script shell devono restare LF (girano su Linux/Railway)
Set-Content "$dest\.gitattributes" "*.sh text eol=lf`n*.bat text eol=crlf" -Encoding ascii

# git del repo di deploy (separato dal repo SvaPro)
if (-not (Test-Path "$dest\.git")) { git -C $dest init -b main | Out-Null }
if (-not (git -C $dest config user.email)) {
  git -C $dest config user.name  "QuisvapoBrain"
  git -C $dest config user.email "vault@quisvapo.local"
}
git -C $dest add -A
git -C $dest commit -m "update vault deploy" --allow-empty | Out-Null

Write-Host ""
Write-Host "Cartella di deploy pronta: $dest"
Write-Host "Primo giro: crea un repo GitHub PRIVATO (es. quisvapo-brain), poi:"
Write-Host "  git -C `"$dest`" remote add origin https://github.com/<tuo-utente>/quisvapo-brain.git"
Write-Host "  git -C `"$dest`" push -u origin main"
Write-Host "Giri successivi: basta  git -C `"$dest`" push"
