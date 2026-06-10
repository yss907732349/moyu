CREATE TABLE `AccountingBill` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `categoryKey` VARCHAR(191) NOT NULL,
    `occurredOn` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `sourceProvider` VARCHAR(191) NULL,
    `sourceOrderId` VARCHAR(191) NULL,
    `sourceStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `AccountingBill_userId_occurredOn_idx` ON `AccountingBill`(`userId`, `occurredOn`);
CREATE INDEX `AccountingBill_userId_status_idx` ON `AccountingBill`(`userId`, `status`);
CREATE INDEX `AccountingBill_sourceProvider_sourceOrderId_idx` ON `AccountingBill`(`sourceProvider`, `sourceOrderId`);

ALTER TABLE `AccountingBill` ADD CONSTRAINT `AccountingBill_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
