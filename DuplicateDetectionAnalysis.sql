/*
=======================================================
    ДИАГНОСТИКА НАЙДЕННЫХ ДУБЛИКАТОВ
=======================================================
*/

-- ДИАГНОСТИЧЕСКИЙ ЗАПРОС - ПОКАЗАТЬ ВСЕ НАЙДЕННЫЕ ГРУППЫ ДУБЛИКАТОВ
SELECT 
    ntfNumExt,
    href,
    ntfName,
    ntfUCmrInn,
    ntfUCmr,
    COUNT(*) as [Количество записей в группе],
    -- Показываем длины для диагностики
    LEN(ntfNumExt) as [Длина ntfNumExt],
    LEN(href) as [Длина href], 
    LEN(ntfName) as [Длина ntfName],
    LEN(ntfUCmrInn) as [Длина ntfUCmrInn],
    LEN(ntfUCmr) as [Длина ntfUCmr],
    -- Показываем ID записей в группе
    STRING_AGG(CAST(ID AS VARCHAR), ', ') as [ID записей]
FROM [zakupkibootCommerc].[dbo].[extNotification]
WHERE ntfNumExt IS NOT NULL AND LEN(RTRIM(ntfNumExt)) > 0
    AND href IS NOT NULL AND LEN(RTRIM(href)) > 0
    AND ntfName IS NOT NULL AND LEN(RTRIM(ntfName)) > 0
    AND ntfUCmrInn IS NOT NULL AND LEN(RTRIM(ntfUCmrInn)) > 0
    AND ntfUCmr IS NOT NULL AND LEN(RTRIM(ntfUCmr)) > 0
    AND (flDubl IS NULL OR flDubl = 0)
    AND (flCorrect IS NULL OR flCorrect = 1)
    -- ИСКЛЮЧАЕМ ЗАПИСИ, ГДЕ ВСЕ ПОЛЯ ПУСТЫЕ
    AND NOT (
        (ntfDescr IS NULL OR LEN(RTRIM(ntfDescr)) = 0) AND
        (publishDate IS NULL) AND
        (p1Date IS NULL) AND
        (p2Date IS NULL) AND
        (p3Date IS NULL) AND
        (ntfPrc IS NULL OR ntfPrc = 0) AND
        (ntfStatus IS NULL OR LEN(RTRIM(ntfStatus)) = 0) AND
        (ntfPlaceApp IS NULL OR LEN(RTRIM(ntfPlaceApp)) = 0) AND
        (ntfProcedureApp IS NULL OR LEN(RTRIM(ntfProcedureApp)) = 0) AND
        (currency IS NULL OR LEN(RTRIM(currency)) = 0) AND
        (ntfUCmrPostAdr IS NULL OR LEN(RTRIM(ntfUCmrPostAdr)) = 0) AND
        (ntfUCmrFactAdr IS NULL OR LEN(RTRIM(ntfUCmrFactAdr)) = 0) AND
        (ntfContactName IS NULL OR LEN(RTRIM(ntfContactName)) = 0) AND
        (ntfContactPhone IS NULL OR LEN(RTRIM(ntfContactPhone)) = 0) AND
        (ntfContactEmail IS NULL OR LEN(RTRIM(ntfContactEmail)) = 0) AND
        (lotCnt IS NULL OR lotCnt = 0) AND
        (fileCnt IS NULL OR fileCnt = 0)
    )
GROUP BY ntfNumExt, href, ntfName, ntfUCmrInn, ntfUCmr
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ДЕТАЛЬНЫЙ ПРОСМОТР ВСЕХ ЗАПИСЕЙ В ГРУППАХ ДУБЛИКАТОВ
WITH DuplicateGroups AS (
    SELECT 
        ntfNumExt,
        href,
        ntfName,
        ntfUCmrInn,
        ntfUCmr,
        COUNT(*) as DuplicateCount
    FROM [zakupkibootCommerc].[dbo].[extNotification]
    WHERE ntfNumExt IS NOT NULL AND LEN(RTRIM(ntfNumExt)) > 0
        AND href IS NOT NULL AND LEN(RTRIM(href)) > 0
        AND ntfName IS NOT NULL AND LEN(RTRIM(ntfName)) > 0
        AND ntfUCmrInn IS NOT NULL AND LEN(RTRIM(ntfUCmrInn)) > 0
        AND ntfUCmr IS NOT NULL AND LEN(RTRIM(ntfUCmr)) > 0
        AND (flDubl IS NULL OR flDubl = 0)
        AND (flCorrect IS NULL OR flCorrect = 1)
        AND NOT (
            (ntfDescr IS NULL OR LEN(RTRIM(ntfDescr)) = 0) AND
            (publishDate IS NULL) AND
            (p1Date IS NULL) AND
            (p2Date IS NULL) AND
            (p3Date IS NULL) AND
            (ntfPrc IS NULL OR ntfPrc = 0) AND
            (ntfStatus IS NULL OR LEN(RTRIM(ntfStatus)) = 0) AND
            (ntfPlaceApp IS NULL OR LEN(RTRIM(ntfPlaceApp)) = 0) AND
            (ntfProcedureApp IS NULL OR LEN(RTRIM(ntfProcedureApp)) = 0) AND
            (currency IS NULL OR LEN(RTRIM(currency)) = 0) AND
            (ntfUCmrPostAdr IS NULL OR LEN(RTRIM(ntfUCmrPostAdr)) = 0) AND
            (ntfUCmrFactAdr IS NULL OR LEN(RTRIM(ntfUCmrFactAdr)) = 0) AND
            (ntfContactName IS NULL OR LEN(RTRIM(ntfContactName)) = 0) AND
            (ntfContactPhone IS NULL OR LEN(RTRIM(ntfContactPhone)) = 0) AND
            (ntfContactEmail IS NULL OR LEN(RTRIM(ntfContactEmail)) = 0) AND
            (lotCnt IS NULL OR lotCnt = 0) AND
            (fileCnt IS NULL OR fileCnt = 0)
        )
    GROUP BY ntfNumExt, href, ntfName, ntfUCmrInn, ntfUCmr
    HAVING COUNT(*) > 1
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY dg.DuplicateCount DESC, n.ntfNumExt) as [Группа],
    n.ID as [ID записи],
    dg.DuplicateCount as [Всего в группе],
    n.flDubl as [flDubl],
    n.flCorrect as [flCorrect],
    -- Показываем точные значения полей для сравнения
    '"' + n.ntfNumExt + '"' as [ntfNumExt],
    '"' + LEFT(n.href, 100) + '"' + CASE WHEN LEN(n.href) > 100 THEN '...' ELSE '' END as [href],
    '"' + LEFT(n.ntfName, 80) + '"' + CASE WHEN LEN(n.ntfName) > 80 THEN '...' ELSE '' END as [ntfName],
    '"' + n.ntfUCmrInn + '"' as [ntfUCmrInn],
    '"' + LEFT(n.ntfUCmr, 60) + '"' + CASE WHEN LEN(n.ntfUCmr) > 60 THEN '...' ELSE '' END as [ntfUCmr],
    n.publishDate as [Дата публикации],
    n.dtCreate as [Дата создания],
    n.dtUpdate as [Дата обновления]
FROM [zakupkibootCommerc].[dbo].[extNotification] n
INNER JOIN DuplicateGroups dg ON 
    n.ntfNumExt = dg.ntfNumExt
    AND n.href = dg.href
    AND n.ntfName = dg.ntfName
    AND n.ntfUCmrInn = dg.ntfUCmrInn
    AND n.ntfUCmr = dg.ntfUCmr
ORDER BY 
    [Группа],
    n.dtUpdate DESC,
    n.ID;

/*
=======================================================
    ПРОЦЕДУРА ОБРАБОТКИ ДУБЛИКАТОВ ДЛЯ АГЕНТА
=======================================================
Назначение: Автоматический поиск и пометка дубликатов
Запуск: раз в час через SQL Server Agent
=======================================================
*/

-- Устанавливаем контекст базы данных
USE [zakupkibootCommerc];
GO

-- Удаление процедуры если существует
IF OBJECT_ID('ProcessNotificationDuplicates', 'P') IS NOT NULL
    DROP PROCEDURE ProcessNotificationDuplicates;
GO

CREATE PROCEDURE ProcessNotificationDuplicates
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Временная таблица для анализа дубликатов
    CREATE TABLE #DuplicateAnalysis (
        ID INT,
        GroupKey NVARCHAR(MAX),
        FullnessScore INT,
        IsLBest BIT DEFAULT 0
    );
    
    -- Шаг 1: Находим записи с дубликатами и вычисляем полноту
    INSERT INTO #DuplicateAnalysis (ID, GroupKey, FullnessScore)
    SELECT 
        ID,
        RTRIM(ISNULL(ntfNumExt,'')) + '|' + 
        RTRIM(ISNULL(href,'')) + '|' + 
        RTRIM(ISNULL(ntfName,'')) + '|' + 
        RTRIM(ISNULL(ntfUCmrInn,'')) + '|' + 
        RTRIM(ISNULL(ntfUCmr,'')) as GroupKey,
        -- Подсчет полноты записи
        (CASE WHEN ntfDescr IS NOT NULL AND LEN(RTRIM(ntfDescr)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN publishDate IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN p1Date IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN p2Date IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN p3Date IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN ntfPrc IS NOT NULL AND LEN(RTRIM(ntfPrc)) > 0 AND ISNUMERIC(ntfPrc) = 1 AND TRY_CAST(ntfPrc AS DECIMAL(18,2)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfStatus IS NOT NULL AND LEN(RTRIM(ntfStatus)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfPlaceApp IS NOT NULL AND LEN(RTRIM(ntfPlaceApp)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfProcedureApp IS NOT NULL AND LEN(RTRIM(ntfProcedureApp)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN currency IS NOT NULL AND LEN(RTRIM(currency)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfUCmrPostAdr IS NOT NULL AND LEN(RTRIM(ntfUCmrPostAdr)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfUCmrFactAdr IS NOT NULL AND LEN(RTRIM(ntfUCmrFactAdr)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfContactName IS NOT NULL AND LEN(RTRIM(ntfContactName)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfContactPhone IS NOT NULL AND LEN(RTRIM(ntfContactPhone)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN ntfContactEmail IS NOT NULL AND LEN(RTRIM(ntfContactEmail)) > 0 THEN 1 ELSE 0 END +
         CASE WHEN lotCnt IS NOT NULL AND ISNUMERIC(lotCnt) = 1 AND TRY_CAST(lotCnt AS INT) > 0 THEN 1 ELSE 0 END +
         CASE WHEN fileCnt IS NOT NULL AND ISNUMERIC(fileCnt) = 1 AND TRY_CAST(fileCnt AS INT) > 0 THEN 1 ELSE 0 END +
         CASE WHEN dtUpdate IS NOT NULL THEN 1 ELSE 0 END) as FullnessScore
    FROM [dbo].[extNotification]
    WHERE ntfNumExt IS NOT NULL AND LEN(RTRIM(ntfNumExt)) > 0
        AND href IS NOT NULL AND LEN(RTRIM(href)) > 0
        AND ntfName IS NOT NULL AND LEN(RTRIM(ntfName)) > 0
        AND ntfUCmrInn IS NOT NULL AND LEN(RTRIM(ntfUCmrInn)) > 0
        AND ntfUCmr IS NOT NULL AND LEN(RTRIM(ntfUCmr)) > 0;
    
    -- Шаг 2: Удаляем записи без дубликатов (уникальные)
    DELETE FROM #DuplicateAnalysis 
    WHERE GroupKey IN (
        SELECT GroupKey 
        FROM #DuplicateAnalysis 
        GROUP BY GroupKey 
        HAVING COUNT(*) = 1
    );
    
    -- Шаг 3: Отмечаем лучшие записи в каждой группе
    UPDATE da1
    SET IsLBest = 1
    FROM #DuplicateAnalysis da1
    WHERE da1.ID = (
        SELECT TOP 1 da2.ID
        FROM #DuplicateAnalysis da2
        INNER JOIN [dbo].[extNotification] n ON da2.ID = n.ID
        WHERE da2.GroupKey = da1.GroupKey
        ORDER BY da2.FullnessScore DESC, n.dtUpdate DESC, da2.ID DESC
    );
    
    -- Шаг 4: Помечаем дубликаты (НЕ лучшие записи)
    UPDATE n
    SET 
        flDubl = 1,
        flCorrect = 0,
        dtUpdate = GETDATE()
    FROM [dbo].[extNotification] n
    INNER JOIN #DuplicateAnalysis da ON n.ID = da.ID
    WHERE da.IsLBest = 0;
    
    -- Шаг 5: Убеждаемся что лучшие записи НЕ помечены как дубликаты
    UPDATE n
    SET 
        flDubl = 0,
        flCorrect = 1,
        dtUpdate = GETDATE()
    FROM [dbo].[extNotification] n
    INNER JOIN #DuplicateAnalysis da ON n.ID = da.ID
    WHERE da.IsLBest = 1
        AND (n.flDubl = 1 OR n.flCorrect = 0);
    
    -- Очистка
    DROP TABLE #DuplicateAnalysis;
    
END;
GO

/*
=======================================================
    ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
=======================================================
*/

-- Запуск процедуры
-- EXEC ProcessNotificationDuplicates;

-- Проверка результатов после обработки
-- SELECT 
--     COUNT(*) as [Всего записей],
--     SUM(CASE WHEN flDubl = 1 THEN 1 ELSE 0 END) as [Помечено как дубликаты],
--     SUM(CASE WHEN flDubl = 0 OR flDubl IS NULL THEN 1 ELSE 0 END) as [Основные записи]
-- FROM [zakupkibootCommerc].[dbo].[extNotification];

-- Просмотр помеченных дубликатов
-- SELECT TOP 100
--     ID, flDubl, flCorrect, ntfNumExt, 
--     LEFT(ntfName, 50) as ntfName,
--     ntfUCmrInn, LEFT(ntfUCmr, 30) as ntfUCmr,
--     dtUpdate
-- FROM [zakupkibootCommerc].[dbo].[extNotification]
-- WHERE flDubl = 1
-- ORDER BY dtUpdate DESC;