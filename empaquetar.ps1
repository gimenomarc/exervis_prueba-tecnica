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

# 3. Descargar Node.js Portable (v20)
Write-Host "2. Descargando Node.js portable (para que el CTO no tenga que instalar nada)..."
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$nodeZip = "node-portable.zip"
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip
Expand-Archive -Path $nodeZip -DestinationPath ".\$distFolder" -Force
Rename-Item -Path ".\$distFolder\node-v20.11.1-win-x64" -NewName "node"
Remove-Item $nodeZip

# 4. Copiar archivos Standalone de Next.js
Write-Host "3. Copiando archivos de la aplicación..."
Copy-Item -Path ".\.next\standalone\*" -Destination ".\$distFolder\" -Recurse
# Copiar static y public que standalone requiere pero no incluye en la raiz
$nextDir = ".\$distFolder\.next"
if (-not (Test-Path $nextDir)) { New-Item -ItemType Directory -Path $nextDir | Out-Null }
Copy-Item -Path ".\.next\static" -Destination ".\$distFolder\.next\static" -Recurse
Copy-Item -Path ".\public" -Destination ".\$distFolder\public" -Recurse

# Copiar package.json (por si acaso Next lo busca)
Copy-Item -Path ".\package.json" -Destination ".\$distFolder\"

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
