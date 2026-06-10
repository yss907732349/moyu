CREATE TABLE `WorkProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `salaryMode` VARCHAR(191) NOT NULL,
    `monthlyAmount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `workStartTime` VARCHAR(191) NOT NULL,
    `workEndTime` VARCHAR(191) NOT NULL,
    `workBreaks` JSON NOT NULL,
    `workdayRuleType` VARCHAR(191) NOT NULL,
    `workdayWeekdays` JSON NOT NULL,
    `paydayDayOfMonth` INTEGER NOT NULL,
    `paydayWeekendStrategy` VARCHAR(191) NOT NULL,
    `hideModeEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkProfile_userId_key`(`userId`),
    INDEX `WorkProfile_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
