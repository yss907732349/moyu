CREATE TABLE `SupplyItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `coverImageUrl` TEXT NULL,
    `actionText` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `validFrom` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `defaultCategoryKey` VARCHAR(191) NOT NULL,
    `jutuikeActId` VARCHAR(191) NOT NULL,
    `jutuikeSourceName` VARCHAR(191) NOT NULL,
    `internalNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupplyItem_sectionKey_status_sortOrder_idx`(`sectionKey`, `status`, `sortOrder`),
    INDEX `SupplyItem_jutuikeActId_idx`(`jutuikeActId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupplyClick` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `supplyItemId` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `defaultCategoryKey` VARCHAR(191) NOT NULL,
    `jutuikeActId` VARCHAR(191) NOT NULL,
    `sid` VARCHAR(191) NOT NULL,
    `jumpStatus` VARCHAR(191) NOT NULL,
    `failureReason` TEXT NULL,
    `clickedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SupplyClick_sid_key`(`sid`),
    INDEX `SupplyClick_userId_clickedAt_idx`(`userId`, `clickedAt`),
    INDEX `SupplyClick_supplyItemId_clickedAt_idx`(`supplyItemId`, `clickedAt`),
    INDEX `SupplyClick_jutuikeActId_idx`(`jutuikeActId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupplyOrderSync` (
    `id` VARCHAR(191) NOT NULL,
    `sourceOrderId` VARCHAR(191) NOT NULL,
    `sid` VARCHAR(191) NULL,
    `actId` VARCHAR(191) NULL,
    `brandId` VARCHAR(191) NULL,
    `sourceStatus` VARCHAR(191) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `matched` BOOLEAN NOT NULL DEFAULT false,
    `ledgerSyncStatus` VARCHAR(191) NOT NULL,
    `ledgerBillId` VARCHAR(191) NULL,
    `failureReason` TEXT NULL,
    `rawSummary` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SupplyOrderSync_sourceOrderId_key`(`sourceOrderId`),
    INDEX `SupplyOrderSync_sid_idx`(`sid`),
    INDEX `SupplyOrderSync_actId_idx`(`actId`),
    INDEX `SupplyOrderSync_ledgerSyncStatus_idx`(`ledgerSyncStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SupplyClick` ADD CONSTRAINT `SupplyClick_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `SupplyClick` ADD CONSTRAINT `SupplyClick_supplyItemId_fkey` FOREIGN KEY (`supplyItemId`) REFERENCES `SupplyItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
