$containerName = "postgres_container"
$dbName = "db_vacancy"
$backupDir = "./backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir/${dbName}_backup_$timestamp.sql"

# Создание директории для резервных копий, если её нет
if (-Not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Выполнение команды pg_dump внутри контейнера
docker exec -t $containerName pg_dump -U postgres -d $dbName -F c > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Резервное копирование успешно завершено. Файл сохранен: $backupFile"
} else {
    Write-Host "Ошибка при резервном копировании."
}
