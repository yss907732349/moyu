CREATE TABLE `CommunityMediaAsset` (
  `id` VARCHAR(191) NOT NULL,
  `ownerUserId` VARCHAR(191) NOT NULL,
  `usage` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  `thumbnailUrl` TEXT NULL,
  `status` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityReply` (
  `id` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
  `commentId` VARCHAR(191) NOT NULL,
  `authorUserId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `authorSnapshot` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `approvedAt` DATETIME(3) NULL,
  `reviewNote` VARCHAR(191) NULL,
  `riskFlags` JSON NULL,
  `moderation` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityNotification` (
  `id` VARCHAR(191) NOT NULL,
  `recipientUserId` VARCHAR(191) NOT NULL,
  `actorUserId` VARCHAR(191) NULL,
  `type` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NULL,
  `commentId` VARCHAR(191) NULL,
  `replyId` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `actorSnapshot` JSON NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CommunityReport`
  ADD COLUMN `replyId` VARCHAR(191) NULL,
  ADD COLUMN `handledBy` VARCHAR(191) NULL,
  ADD COLUMN `handledAt` DATETIME(3) NULL,
  ADD COLUMN `handleNote` TEXT NULL;

CREATE INDEX `CommunityMediaAsset_ownerUserId_status_idx` ON `CommunityMediaAsset`(`ownerUserId`, `status`);
CREATE INDEX `CommunityMediaAsset_postId_status_idx` ON `CommunityMediaAsset`(`postId`, `status`);
CREATE INDEX `CommunityReply_commentId_status_approvedAt_idx` ON `CommunityReply`(`commentId`, `status`, `approvedAt`);
CREATE INDEX `CommunityReply_postId_status_approvedAt_idx` ON `CommunityReply`(`postId`, `status`, `approvedAt`);
CREATE INDEX `CommunityReply_authorUserId_status_idx` ON `CommunityReply`(`authorUserId`, `status`);
CREATE INDEX `CommunityNotification_recipientUserId_readAt_createdAt_idx` ON `CommunityNotification`(`recipientUserId`, `readAt`, `createdAt`);
CREATE INDEX `CommunityNotification_postId_idx` ON `CommunityNotification`(`postId`);
CREATE INDEX `CommunityNotification_commentId_idx` ON `CommunityNotification`(`commentId`);
CREATE INDEX `CommunityNotification_replyId_idx` ON `CommunityNotification`(`replyId`);
CREATE INDEX `CommunityReport_replyId_idx` ON `CommunityReport`(`replyId`);

ALTER TABLE `CommunityMediaAsset`
  ADD CONSTRAINT `CommunityMediaAsset_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityMediaAsset_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CommunityReply`
  ADD CONSTRAINT `CommunityReply_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityReply_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `CommunityComment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityReply_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CommunityReport`
  ADD CONSTRAINT `CommunityReport_replyId_fkey` FOREIGN KEY (`replyId`) REFERENCES `CommunityReply`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CommunityNotification`
  ADD CONSTRAINT `CommunityNotification_recipientUserId_fkey` FOREIGN KEY (`recipientUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityNotification_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityNotification_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `CommunityComment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `CommunityNotification_replyId_fkey` FOREIGN KEY (`replyId`) REFERENCES `CommunityReply`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
