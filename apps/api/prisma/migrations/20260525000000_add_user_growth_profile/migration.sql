CREATE TABLE `AppUser` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WechatIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `openid` VARCHAR(191) NOT NULL,
    `unionid` VARCHAR(191) NULL,
    `sessionKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WechatIdentity_openid_key`(`openid`),
    INDEX `WechatIdentity_userId_idx`(`userId`),
    INDEX `WechatIdentity_unionid_idx`(`unionid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserGrowthProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `professionType` VARCHAR(191) NOT NULL,
    `faction` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `avatarKey` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `totalExperience` INTEGER NOT NULL DEFAULT 0,
    `hiddenCoins` INTEGER NOT NULL DEFAULT 0,
    `energy` INTEGER NOT NULL DEFAULT 0,
    `checkinStreak` INTEGER NOT NULL DEFAULT 0,
    `lastCheckinDate` VARCHAR(191) NULL,
    `titleKey` VARCHAR(191) NOT NULL,
    `equippedBadgeKeys` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserGrowthProfile_userId_key`(`userId`),
    INDEX `UserGrowthProfile_faction_idx`(`faction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DailyCheckin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessDate` VARCHAR(191) NOT NULL,
    `reward` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DailyCheckin_userId_businessDate_key`(`userId`, `businessDate`),
    INDEX `DailyCheckin_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WechatIdentity` ADD CONSTRAINT `WechatIdentity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserGrowthProfile` ADD CONSTRAINT `UserGrowthProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DailyCheckin` ADD CONSTRAINT `DailyCheckin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
