ALTER TABLE `AppUser`
  ADD COLUMN `privacyPolicyVersion` VARCHAR(191) NULL,
  ADD COLUMN `communityAgreementVersion` VARCHAR(191) NULL,
  ADD COLUMN `privacyConsentAcceptedAt` DATETIME(3) NULL,
  ADD COLUMN `privacyConsentScene` VARCHAR(191) NULL,
  ADD COLUMN `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `phoneVerificationSource` VARCHAR(191) NULL,
  ADD COLUMN `phoneNumberHash` VARCHAR(191) NULL;

ALTER TABLE `CommunityPost`
  ADD COLUMN `ipLocationLabel` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationCountryOrRegion` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationProvince` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationSource` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationStatus` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationResolvedAt` DATETIME(3) NULL,
  ADD COLUMN `ipLocationFailureReason` TEXT NULL;

ALTER TABLE `CommunityComment`
  ADD COLUMN `ipLocationLabel` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationCountryOrRegion` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationProvince` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationSource` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationStatus` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationResolvedAt` DATETIME(3) NULL,
  ADD COLUMN `ipLocationFailureReason` TEXT NULL;

ALTER TABLE `CommunityReply`
  ADD COLUMN `ipLocationLabel` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationCountryOrRegion` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationProvince` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationSource` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationStatus` VARCHAR(191) NULL,
  ADD COLUMN `ipLocationResolvedAt` DATETIME(3) NULL,
  ADD COLUMN `ipLocationFailureReason` TEXT NULL;

CREATE INDEX `CommunityPost_ipLocationStatus_idx`
  ON `CommunityPost`(`ipLocationStatus`);

CREATE INDEX `CommunityComment_ipLocationStatus_idx`
  ON `CommunityComment`(`ipLocationStatus`);

CREATE INDEX `CommunityReply_ipLocationStatus_idx`
  ON `CommunityReply`(`ipLocationStatus`);
