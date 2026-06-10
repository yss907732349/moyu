CREATE TABLE `SurvivalLedgerBill` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `sourceProvider` VARCHAR(191) NOT NULL,
  `sourceOrderId` VARCHAR(191) NOT NULL,
  `sourceStatus` VARCHAR(191) NOT NULL,
  `amountMinor` INTEGER NOT NULL,
  `currency` VARCHAR(191) NOT NULL,
  `categoryKey` VARCHAR(191) NOT NULL,
  `displayTitle` VARCHAR(191) NOT NULL,
  `occurredAt` DATETIME(3) NOT NULL,
  `occurredOn` VARCHAR(191) NOT NULL,
  `displayStatus` VARCHAR(191) NOT NULL,
  `countsTowardConsumption` BOOLEAN NOT NULL DEFAULT false,
  `productTitle` VARCHAR(191) NULL,
  `productCategory` VARCHAR(191) NULL,
  `merchantTags` JSON NULL,
  `commuteDistanceMeters` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `SurvivalLedgerBill_sourceProvider_sourceOrderId_key`(`sourceProvider`, `sourceOrderId`),
  INDEX `SurvivalLedgerBill_userId_occurredOn_idx`(`userId`, `occurredOn`),
  INDEX `SurvivalLedgerBill_userId_categoryKey_idx`(`userId`, `categoryKey`),
  INDEX `SurvivalLedgerBill_userId_displayStatus_idx`(`userId`, `displayStatus`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SurvivalLedgerBill`
  ADD CONSTRAINT `SurvivalLedgerBill_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
