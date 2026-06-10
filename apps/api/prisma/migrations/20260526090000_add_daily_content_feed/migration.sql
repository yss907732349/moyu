ALTER TABLE `AppUser`
  ADD INDEX `AppUser_id_idx` (`id`);

ALTER TABLE `CommunityPost`
  ADD COLUMN `dailyContentQuote` JSON NULL;

CREATE TABLE `DailyContentIssue` (
  `id` VARCHAR(191) NOT NULL,
  `businessDate` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `homeSummary` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `scheduledPublishAt` DATETIME(3) NULL,
  `publishedAt` DATETIME(3) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `reviewNote` TEXT NULL,
  `aiDraftMetadata` JSON NULL,
  `internalRiskTags` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `DailyContentIssue_businessDate_status_idx` (`businessDate`, `status`),
  INDEX `DailyContentIssue_status_publishedAt_idx` (`status`, `publishedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DailyContentSection` (
  `id` VARCHAR(191) NOT NULL,
  `issueId` VARCHAR(191) NOT NULL,
  `sectionKey` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `summary` TEXT NOT NULL,
  `sortOrder` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `DailyContentSection_issueId_sectionKey_key` (`issueId`, `sectionKey`),
  INDEX `DailyContentSection_issueId_sortOrder_idx` (`issueId`, `sortOrder`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DailyContentItem` (
  `id` VARCHAR(191) NOT NULL,
  `sectionId` VARCHAR(191) NOT NULL,
  `issueId` VARCHAR(191) NOT NULL,
  `sectionKey` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `summary` TEXT NOT NULL,
  `body` TEXT NOT NULL,
  `source` JSON NULL,
  `allowLike` BOOLEAN NOT NULL DEFAULT true,
  `allowCommunityQuote` BOOLEAN NOT NULL DEFAULT true,
  `quotePrompt` TEXT NULL,
  `sortOrder` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `DailyContentItem_issueId_sectionKey_idx` (`issueId`, `sectionKey`),
  INDEX `DailyContentItem_sectionId_sortOrder_idx` (`sectionId`, `sortOrder`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DailyContentSourceInput` (
  `id` VARCHAR(191) NOT NULL,
  `issueId` VARCHAR(191) NOT NULL,
  `sectionKey` VARCHAR(191) NOT NULL,
  `sourceTitle` VARCHAR(191) NULL,
  `sourceName` VARCHAR(191) NULL,
  `sourceUrl` VARCHAR(191) NULL,
  `publishedAt` VARCHAR(191) NULL,
  `collectedAt` VARCHAR(191) NULL,
  `rawInput` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `DailyContentSourceInput_issueId_sectionKey_idx` (`issueId`, `sectionKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DailyContentItemLike` (
  `id` VARCHAR(191) NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `DailyContentItemLike_itemId_userId_key` (`itemId`, `userId`),
  INDEX `DailyContentItemLike_userId_idx` (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DailyContentSection`
  ADD CONSTRAINT `DailyContentSection_issueId_fkey`
  FOREIGN KEY (`issueId`) REFERENCES `DailyContentIssue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DailyContentItem`
  ADD CONSTRAINT `DailyContentItem_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `DailyContentSection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DailyContentItemLike`
  ADD CONSTRAINT `DailyContentItemLike_itemId_fkey`
  FOREIGN KEY (`itemId`) REFERENCES `DailyContentItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DailyContentItemLike`
  ADD CONSTRAINT `DailyContentItemLike_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
