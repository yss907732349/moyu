CREATE TABLE `CommunityUserGovernance` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `note` TEXT NULL,
  `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NULL,
  `operatorId` VARCHAR(191) NOT NULL,
  `clearedAt` DATETIME(3) NULL,
  `clearedBy` VARCHAR(191) NULL,
  `clearReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CommunityUserGovernance_userId_key`(`userId`),
  INDEX `CommunityUserGovernance_status_expiresAt_idx`(`status`, `expiresAt`),
  INDEX `CommunityUserGovernance_userId_status_idx`(`userId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityGovernanceAudit` (
  `id` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `targetAuthorUserId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `oldStatus` VARCHAR(191) NULL,
  `newStatus` VARCHAR(191) NULL,
  `reason` TEXT NOT NULL,
  `note` TEXT NULL,
  `operatorId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `CommunityGovernanceAudit_targetType_targetId_idx`(`targetType`, `targetId`),
  INDEX `CommunityGovernanceAudit_targetAuthorUserId_createdAt_idx`(`targetAuthorUserId`, `createdAt`),
  INDEX `CommunityGovernanceAudit_action_createdAt_idx`(`action`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CommunityUserGovernance`
  ADD CONSTRAINT `CommunityUserGovernance_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CommunityGovernanceAudit`
  ADD CONSTRAINT `CommunityGovernanceAudit_targetAuthorUserId_fkey`
  FOREIGN KEY (`targetAuthorUserId`) REFERENCES `AppUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `CommunityPost_sectionKey_status_createdAt_idx` ON `CommunityPost`(`sectionKey`, `status`, `createdAt`);
CREATE INDEX `CommunityPost_authorUserId_createdAt_idx` ON `CommunityPost`(`authorUserId`, `createdAt`);
CREATE INDEX `CommunityComment_postId_createdAt_idx` ON `CommunityComment`(`postId`, `createdAt`);
CREATE INDEX `CommunityComment_authorUserId_createdAt_idx` ON `CommunityComment`(`authorUserId`, `createdAt`);
CREATE INDEX `CommunityReply_postId_createdAt_idx` ON `CommunityReply`(`postId`, `createdAt`);
CREATE INDEX `CommunityReply_authorUserId_createdAt_idx` ON `CommunityReply`(`authorUserId`, `createdAt`);
