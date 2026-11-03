# Publish Jeda to GitHub Pages (https://juw12.github.io/jeda/).
# Run:  powershell -ExecutionPolicy Bypass -File E:\jeda\publish.ps1
# Needs: GitHub CLI (gh) logged in as juw12. Safe to run again: it only pushes new commits.

Set-Location $PSScriptRoot
$repo = 'juw12/jeda'

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Login dulu: gh auth login'
    exit 1
}

if (-not ((git remote) -contains 'origin')) {
    gh repo view $repo *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Membuat repo publik $repo ..."
        gh repo create $repo --public --description 'Jeda - ruang hening setiap iman (PWA)' --source . --remote origin
        if ($LASTEXITCODE -ne 0) { exit 1 }
    } else {
        git remote add origin "https://github.com/$repo.git"
    }
}

Write-Host 'Mengunggah commit ...'
git push -u origin main
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host 'Mengaktifkan GitHub Pages (branch main, folder root) ...'
gh api -X POST "repos/$repo/pages" -f 'source[branch]=main' -f 'source[path]=/' *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Pages sudah aktif (atau aktifkan manual: Settings -> Pages).'
}

Write-Host ''
Write-Host 'Selesai. Situs akan aktif dalam 1-2 menit di: https://juw12.github.io/jeda/'
