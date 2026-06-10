ALTER TABLE `SurvivalLedgerBill`
  ADD COLUMN `displayStatusReason` TEXT NULL,
  ADD COLUMN `stateHistory` JSON NULL,
  ADD COLUMN `ledgerStateReason` VARCHAR(191) NULL;

ALTER TABLE `SupplyItem`
  ADD COLUMN `groupKey` VARCHAR(191) NOT NULL DEFAULT 'general',
  ADD COLUMN `userVisibleTags` JSON NULL,
  ADD COLUMN `displayPriority` INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN `recommendationTimeWindows` JSON NULL,
  ADD COLUMN `displayWorkdayRule` VARCHAR(191) NOT NULL DEFAULT 'workdays_only',
  ADD COLUMN `attributionWindowHours` INTEGER NOT NULL DEFAULT 168,
  ADD COLUMN `transferExpiresMinutes` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `clickDedupeWindowSeconds` INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN `fallbackStrategy` VARCHAR(191) NOT NULL DEFAULT 'none',
  ADD COLUMN `fallbackTargetType` VARCHAR(191) NULL,
  ADD COLUMN `fallbackUrl` TEXT NULL,
  ADD COLUMN `fallbackMiniappAppId` VARCHAR(191) NULL,
  ADD COLUMN `fallbackMiniappPath` TEXT NULL;

UPDATE `SupplyItem`
SET
  `groupKey` = CASE
    WHEN `sectionKey` = 'commute' THEN 'commute'
    WHEN `sectionKey` = 'afternoon_boost' THEN 'afternoon_boost'
    ELSE 'lunch'
  END,
  `userVisibleTags` = CASE
    WHEN `sectionKey` = 'commute' THEN JSON_ARRAY('通勤', '工作日推荐')
    WHEN `sectionKey` = 'afternoon_boost' THEN JSON_ARRAY('咖啡', '茶饮', '下午续命')
    ELSE JSON_ARRAY('外卖', '午间饭票', '工作日推荐')
  END,
  `recommendationTimeWindows` = CASE
    WHEN `sectionKey` = 'commute' THEN JSON_ARRAY(
      JSON_OBJECT('slot', 'morning_commute', 'startTime', '07:00', 'endTime', '10:00'),
      JSON_OBJECT('slot', 'evening_commute', 'startTime', '17:00', 'endTime', '21:00')
    )
    WHEN `sectionKey` = 'afternoon_boost' THEN JSON_ARRAY(
      JSON_OBJECT('slot', 'afternoon', 'startTime', '14:00', 'endTime', '17:30')
    )
    ELSE JSON_ARRAY(
      JSON_OBJECT('slot', 'lunch', 'startTime', '10:30', 'endTime', '13:30')
    )
  END
WHERE `userVisibleTags` IS NULL OR `recommendationTimeWindows` IS NULL;

ALTER TABLE `SupplyItem`
  MODIFY `userVisibleTags` JSON NOT NULL,
  MODIFY `recommendationTimeWindows` JSON NOT NULL;

CREATE INDEX `SupplyItem_status_groupKey_displayPriority_idx`
  ON `SupplyItem`(`status`, `groupKey`, `displayPriority`);

ALTER TABLE `SupplyClick`
  ADD COLUMN `sidDigest` VARCHAR(191) NULL,
  ADD COLUMN `sidMasked` VARCHAR(191) NULL,
  ADD COLUMN `transferExpiresAt` DATETIME(3) NULL,
  ADD COLUMN `attributionWindowEndsAt` DATETIME(3) NULL,
  ADD COLUMN `jumpTargetType` VARCHAR(191) NULL,
  ADD COLUMN `jumpTargetExpiresAt` DATETIME(3) NULL,
  ADD COLUMN `fallbackAttributable` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `reusedFromClickId` VARCHAR(191) NULL;

UPDATE `SupplyClick`
SET
  `sidDigest` = SHA2(`sid`, 256),
  `sidMasked` = CASE
    WHEN CHAR_LENGTH(`sid`) <= 10 THEN CONCAT(LEFT(`sid`, 2), '***')
    ELSE CONCAT(LEFT(`sid`, 6), '...', RIGHT(`sid`, 4))
  END,
  `transferExpiresAt` = DATE_ADD(`clickedAt`, INTERVAL 30 MINUTE),
  `attributionWindowEndsAt` = DATE_ADD(`clickedAt`, INTERVAL 168 HOUR)
WHERE `sidMasked` IS NULL;

ALTER TABLE `SupplyClick`
  MODIFY `sidMasked` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `SupplyClick_sidDigest_key` ON `SupplyClick`(`sidDigest`);
CREATE INDEX `SupplyClick_sidDigest_idx` ON `SupplyClick`(`sidDigest`);

CREATE TABLE `SupplyTransferAttempt` (
  `id` VARCHAR(191) NOT NULL,
  `clickId` VARCHAR(191) NOT NULL,
  `supplyItemId` VARCHAR(191) NOT NULL,
  `sidDigest` VARCHAR(191) NULL,
  `sidMasked` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NULL,
  `targetPayload` JSON NULL,
  `usedFallback` BOOLEAN NOT NULL DEFAULT false,
  `fallbackAttributable` BOOLEAN NOT NULL DEFAULT false,
  `failureReason` TEXT NULL,
  `targetExpiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `SupplyTransferAttempt_clickId_createdAt_idx`(`clickId`, `createdAt`),
  INDEX `SupplyTransferAttempt_supplyItemId_createdAt_idx`(`supplyItemId`, `createdAt`),
  INDEX `SupplyTransferAttempt_sidDigest_idx`(`sidDigest`),
  INDEX `SupplyTransferAttempt_status_createdAt_idx`(`status`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SupplyTransferAttempt`
  ADD CONSTRAINT `SupplyTransferAttempt_clickId_fkey`
  FOREIGN KEY (`clickId`) REFERENCES `SupplyClick`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `SupplyTransferAttempt`
  ADD CONSTRAINT `SupplyTransferAttempt_supplyItemId_fkey`
  FOREIGN KEY (`supplyItemId`) REFERENCES `SupplyItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `SupplyOrderSync`
  ADD COLUMN `sourceProvider` VARCHAR(191) NOT NULL DEFAULT 'jutuike',
  ADD COLUMN `sidDigest` VARCHAR(191) NULL,
  ADD COLUMN `sidMasked` VARCHAR(191) NULL,
  ADD COLUMN `mappedStatus` VARCHAR(191) NOT NULL DEFAULT 'unknown',
  ADD COLUMN `matchedClickId` VARCHAR(191) NULL,
  ADD COLUMN `matchedSupplyItemId` VARCHAR(191) NULL,
  ADD COLUMN `ledgerAction` VARCHAR(191) NOT NULL DEFAULT 'skipped',
  ADD COLUMN `attributionFailureReason` VARCHAR(191) NULL,
  ADD COLUMN `exceptionType` VARCHAR(191) NULL,
  ADD COLUMN `failureExplanation` TEXT NULL,
  ADD COLUMN `statusHistory` JSON NULL;

UPDATE `SupplyOrderSync`
SET
  `sidDigest` = CASE WHEN `sid` IS NULL THEN NULL ELSE SHA2(`sid`, 256) END,
  `sidMasked` = CASE
    WHEN `sid` IS NULL THEN NULL
    WHEN CHAR_LENGTH(`sid`) <= 10 THEN CONCAT(LEFT(`sid`, 2), '***')
    ELSE CONCAT(LEFT(`sid`, 6), '...', RIGHT(`sid`, 4))
  END,
  `mappedStatus` = CASE
    WHEN `sourceStatus` IN ('paid', 'settled', 'pending_settle', 'pay', 'valid', '1', '2') THEN 'effective'
    WHEN `sourceStatus` IN ('unpaid', 'created', 'pending', '0', 'wait_pay') THEN 'unpaid'
    WHEN `sourceStatus` IN ('refunded', 'refund') THEN 'refunded'
    WHEN `sourceStatus` IN ('cancelled', 'canceled', 'cancel') THEN 'cancelled'
    WHEN `sourceStatus` IN ('risk_rejected', 'risk') THEN 'risk_rejected'
    WHEN `sourceStatus` IN ('settle_failed', 'failed') THEN 'settle_failed'
    WHEN `sourceStatus` IN ('invalid', '-1') THEN 'invalid'
    ELSE 'unknown'
  END,
  `ledgerAction` = CASE
    WHEN `ledgerSyncStatus` = 'imported' THEN 'created'
    WHEN `ledgerSyncStatus` = 'excluded' THEN 'excluded'
    WHEN `ledgerSyncStatus` = 'failed' THEN 'failed'
    ELSE 'skipped'
  END,
  `statusHistory` = JSON_ARRAY(
    JSON_OBJECT(
      'changedAt', DATE_FORMAT(`updatedAt`, '%Y-%m-%dT%H:%i:%s.000Z'),
      'changeType', 'first_sync',
      'sourceStatus', `mappedStatus`,
      'amountMinor', `amountMinor`,
      'ledgerAction', `ledgerAction`,
      'reason', `failureReason`
    )
  )
WHERE `statusHistory` IS NULL;

ALTER TABLE `SupplyOrderSync` DROP INDEX `SupplyOrderSync_sourceOrderId_key`;

CREATE UNIQUE INDEX `SupplyOrderSync_sourceProvider_sourceOrderId_key`
  ON `SupplyOrderSync`(`sourceProvider`, `sourceOrderId`);
CREATE INDEX `SupplyOrderSync_sidDigest_idx` ON `SupplyOrderSync`(`sidDigest`);
CREATE INDEX `SupplyOrderSync_exceptionType_idx` ON `SupplyOrderSync`(`exceptionType`);
CREATE INDEX `SupplyOrderSync_matchedSupplyItemId_idx` ON `SupplyOrderSync`(`matchedSupplyItemId`);
