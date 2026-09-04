$ErrorActionPreference = "Stop"

Write-Host "Preparando empaquetado de la aplicación..." -ForegroundColor Cyan

# 1. Hacer build de Next.js
Write-Host "1. Compilando aplicación Next.js..."
npm run build

# 2. Crear carpeta de distribución
$distFolder = "exervis-app-cto"
if (Test-Path $distFolder) {
    Remove-Item $distFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $distFolder | Out-Null

# 3. Descargar Node.js Portable
# IMPORTANTE: pdf-parse/pdfjs-dist necesita APIs de Node relativamente
# recientes (process.getBuiltinModule, polyfills de DOMMatrix/ImageData).
# Node 20.11.1 es DEMASIADO ANTIGUO y provoca un 500 en /api/emails y en
# el procesado. Usamos una version reciente (22 LTS) para evitarlo.
Write-Host "2. Descargando Node.js portable (para que el CTO no tenga que instalar nada)..."
$nodeUrl = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip"
$nodeZip = "node-portable.zip"
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip
Expand-Archive -Path $nodeZip -DestinationPath ".\$distFolder" -Force
Rename-Item -Path ".\$distFolder\node-v22.11.0-win-x64" -NewName "node"
Remove-Item $nodeZip

# 4. Copiar archivos Standalone de Next.js
Write-Host "3. Copiando archivos de la aplicación..."
Copy-Item -Path ".\.next\standalone\*" -Destination ".\$distFolder\" -Recurse -Force
# Copiar static y public que standalone requiere pero no incluye en la raiz
$nextDir = ".\$distFolder\.next"
if (-not (Test-Path $nextDir)) { New-Item -ItemType Directory -Path $nextDir | Out-Null }
Copy-Item -Path ".\.next\static" -Destination ".\$distFolder\.next\static" -Recurse
Copy-Item -Path ".\public" -Destination ".\$distFolder\public" -Recurse

# Copiar package.json (por si acaso Next lo busca)
Copy-Item -Path ".\package.json" -Destination ".\$distFolder\"

# IMPORTANTE: el rastreo automatico de dependencias de Next.js/Turbopack
# ("output: standalone") no detecta paquetes que se cargan con require/import
# dinamico (imap, imap-simple, mailparser, openai, nodemailer, mammoth, xlsx...).
# Sustituimos el node_modules recortado por el node_modules completo del
# proyecto para garantizar que todo lo que la app necesita en tiempo de
# ejecucion esta presente. Es mas grande, pero evita 500 en produccion.
Write-Host "3b. Sustituyendo node_modules recortado por el completo (evita fallos en runtime)..."
Remove-Item -Path ".\$distFolder\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path ".\node_modules" -Destination ".\$distFolder\node_modules" -Recurse -Force

# Copiar variables de entorno (API keys de OpenAI, etc)
if (Test-Path ".\.env") {
    Copy-Item -Path ".\.env" -Destination ".\$distFolder\.env"
} elseif (Test-Path ".\.env.local") {
    Copy-Item -Path ".\.env.local" -Destination ".\$distFolder\.env.local"
}

# 5. Crear el archivo .bat (El "ejecutable" que usará el CTO)
Write-Host "4. Creando el archivo ejecutable iniciar_prueba.bat..."
$batContent = @"
@echo off
echo Iniciando Exervis Mail Triage...
echo Por favor, espera unos segundos.
start "" http://localhost:3000
.\node\node.exe server.js
pause
"@
Set-Content -Path ".\$distFolder\iniciar_prueba.bat" -Value $batContent

# 5b. Copiar el manual de uso (HTML autocontenido, sin depender de nada)
# junto al .bat, para que quien reciba el zip lo pueda abrir directamente
# haciendo doble clic (se abre en su navegador por defecto). Vive en
# public/ (unica fuente, tambien lo sirve la propia app via el boton
# "Manual de uso" del dashboard) y aqui se copia con el nombre bonito.
Write-Host "4b. Copiando el manual de uso..."
Copy-Item -Path ".\public\manual-de-uso.html" -Destination ".\$distFolder\MANUAL DE USO.html" -Force

# 6. Comprimir todo en un ZIP listo para enviar
Write-Host "5. Comprimiendo la aplicacion en exervis-prueba-tecnica.zip..."
if (Test-Path "exervis-prueba-tecnica.zip") {
    Remove-Item "exervis-prueba-tecnica.zip" -Force
}
Compress-Archive -Path ".\$distFolder\*" -DestinationPath "exervis-prueba-tecnica.zip"

# Limpiar carpeta temporal
Remove-Item $distFolder -Recurse -Force

Write-Host ""
Write-Host "¡PROCESO COMPLETADO!" -ForegroundColor Green
Write-Host "Se ha generado el archivo 'exervis-prueba-tecnica.zip'." -ForegroundColor Yellow
Write-Host "Envía este archivo .zip al CTO. Él solo tiene que:"
Write-Host "1. Descomprimir el archivo en su ordenador."
Write-Host "2. Hacer doble clic en 'iniciar_prueba.bat'."
Write-Host "No necesita tener Node.js ni instalar dependencias."
