ALTER TABLE `CommunityReport`
  ADD COLUMN `targetKey` VARCHAR(191) NULL,
  ADD COLUMN `reasonCode` VARCHAR(191) NOT NULL DEFAULT 'other',
  ADD COLUMN `reasonText` TEXT NULL,
  ADD COLUMN `targetSnapshot` JSON NULL,
  ADD COLUMN `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
  ADD COLUMN `handledAction` VARCHAR(191) NULL,
  ADD COLUMN `effectiveForAuthorRisk` BOOLEAN NOT NULL DEFAULT false;

UPDATE `CommunityReport`
SET `reasonText` = `reason`
WHERE `reasonText` IS NULL;

UPDATE `CommunityReport`
SET `targetKey` = CONCAT(
  `targetType`,
  ':',
  COALESCE(`postId`, `commentId`, `replyId`, `id`)
)
WHERE `targetKey` IS NULL;

ALTER TABLE `CommunityReport`
  MODIFY COLUMN `targetKey` VARCHAR(191) NOT NULL;

CREATE INDEX `CommunityReport_targetKey_status_idx`
  ON `CommunityReport`(`targetKey`, `status`);

CREATE INDEX `CommunityReport_reporterUserId_targetKey_idx`
  ON `CommunityReport`(`reporterUserId`, `targetKey`);

CREATE INDEX `CommunityReport_priority_status_createdAt_idx`
  ON `CommunityReport`(`priority`, `status`, `createdAt`);

CREATE INDEX `CommunityReport_effectiveForAuthorRisk_idx`
  ON `CommunityReport`(`effectiveForAuthorRisk`);
