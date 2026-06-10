ALTER TABLE `DailyContentSection`
  ADD COLUMN `illustrationKey` VARCHAR(191) NULL;

CREATE TABLE `DailyContentArticleComment` (
  `id` VARCHAR(191) NOT NULL,
  `articleId` VARCHAR(191) NOT NULL,
  `authorUserId` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `authorSnapshot` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `approvedAt` DATETIME(3) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `reviewNote` TEXT NULL,
  `moderation` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `DailyContentArticleComment_articleId_status_approvedAt_idx` (`articleId`, `status`, `approvedAt`),
  INDEX `DailyContentArticleComment_authorUserId_status_idx` (`authorUserId`, `status`),
  INDEX `DailyContentArticleComment_status_createdAt_idx` (`status`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DailyContentArticleComment`
  ADD CONSTRAINT `DailyContentArticleComment_articleId_fkey`
  FOREIGN KEY (`articleId`) REFERENCES `DailyContentItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DailyContentArticleComment`
  ADD CONSTRAINT `DailyContentArticleComment_authorUserId_fkey`
  FOREIGN KEY (`authorUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
