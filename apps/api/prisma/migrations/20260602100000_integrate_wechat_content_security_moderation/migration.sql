ALTER TABLE `CommunityMediaAsset`
  ADD COLUMN `contentSecurityStatus` VARCHAR(191) NOT NULL DEFAULT 'not_required',
  ADD COLUMN `contentSecurityTraceIdDigest` VARCHAR(191) NULL,
  ADD COLUMN `contentSecurityTraceIdMasked` VARCHAR(191) NULL,
  ADD COLUMN `contentSecuritySummary` JSON NULL,
  ADD COLUMN `contentSecurityCheckedAt` DATETIME(3) NULL;

CREATE INDEX `CommunityMediaAsset_contentSecurityStatus_idx`
  ON `CommunityMediaAsset`(`contentSecurityStatus`);

CREATE INDEX `CommunityMediaAsset_contentSecurityTraceIdDigest_idx`
  ON `CommunityMediaAsset`(`contentSecurityTraceIdDigest`);
