ALTER TABLE `UserGrowthProfile`
  ADD COLUMN `publicProfileId` VARCHAR(191) NULL;

UPDATE `UserGrowthProfile`
SET `publicProfileId` = CONCAT('pp_', REPLACE(UUID(), '-', ''))
WHERE `publicProfileId` IS NULL;

CREATE UNIQUE INDEX `UserGrowthProfile_publicProfileId_key`
  ON `UserGrowthProfile`(`publicProfileId`);

CREATE TABLE `CommunityFollow` (
  `id` VARCHAR(191) NOT NULL,
  `followerUserId` VARCHAR(191) NOT NULL,
  `followingUserId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `CommunityFollow_followerUserId_followingUserId_key`
  ON `CommunityFollow`(`followerUserId`, `followingUserId`);

CREATE INDEX `CommunityFollow_followerUserId_createdAt_idx`
  ON `CommunityFollow`(`followerUserId`, `createdAt`);

CREATE INDEX `CommunityFollow_followingUserId_createdAt_idx`
  ON `CommunityFollow`(`followingUserId`, `createdAt`);

ALTER TABLE `CommunityFollow`
  ADD CONSTRAINT `CommunityFollow_followerUserId_fkey`
  FOREIGN KEY (`followerUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CommunityFollow`
  ADD CONSTRAINT `CommunityFollow_followingUserId_fkey`
  FOREIGN KEY (`followingUserId`) REFERENCES `AppUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
