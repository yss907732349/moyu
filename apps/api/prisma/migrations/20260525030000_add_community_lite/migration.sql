CREATE TABLE `CommunityPost` (
  `id` VARCHAR(191) NOT NULL,
  `authorUserId` VARCHAR(191) NOT NULL,
  `sectionKey` VARCHAR(191) NOT NULL,
  `authorFaction` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `imageKeys` JSON NOT NULL,
  `authorSnapshot` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `approvedAt` DATETIME(3) NULL,
  `reviewNote` VARCHAR(191) NULL,
  `riskFlags` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CommunityPost_sectionKey_status_approvedAt_idx` (`sectionKey`, `status`, `approvedAt`),
  INDEX `CommunityPost_authorUserId_status_idx` (`authorUserId`, `status`),
  INDEX `CommunityPost_status_createdAt_idx` (`status`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityComment` (
  `id` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
  `authorUserId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `authorSnapshot` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `approvedAt` DATETIME(3) NULL,
  `reviewNote` VARCHAR(191) NULL,
  `riskFlags` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CommunityComment_postId_status_approvedAt_idx` (`postId`, `status`, `approvedAt`),
  INDEX `CommunityComment_authorUserId_status_idx` (`authorUserId`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityPostLike` (
  `id` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CommunityPostLike_postId_userId_key` (`postId`, `userId`),
  INDEX `CommunityPostLike_userId_idx` (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityPostFavorite` (
  `id` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CommunityPostFavorite_postId_userId_key` (`postId`, `userId`),
  INDEX `CommunityPostFavorite_userId_idx` (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunityReport` (
  `id` VARCHAR(191) NOT NULL,
  `reporterUserId` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL,
  `postId` VARCHAR(191) NULL,
  `commentId` VARCHAR(191) NULL,
  `reason` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CommunityReport_targetType_status_idx` (`targetType`, `status`),
  INDEX `CommunityReport_reporterUserId_idx` (`reporterUserId`),
  INDEX `CommunityReport_postId_idx` (`postId`),
  INDEX `CommunityReport_commentId_idx` (`commentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CommunityPost` ADD CONSTRAINT `CommunityPost_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityComment` ADD CONSTRAINT `CommunityComment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityComment` ADD CONSTRAINT `CommunityComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityPostLike` ADD CONSTRAINT `CommunityPostLike_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityPostLike` ADD CONSTRAINT `CommunityPostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityPostFavorite` ADD CONSTRAINT `CommunityPostFavorite_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityPostFavorite` ADD CONSTRAINT `CommunityPostFavorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityReport` ADD CONSTRAINT `CommunityReport_reporterUserId_fkey` FOREIGN KEY (`reporterUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CommunityReport` ADD CONSTRAINT `CommunityReport_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `CommunityPost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CommunityReport` ADD CONSTRAINT `CommunityReport_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `CommunityComment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
