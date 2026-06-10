import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import {
  getFeatureEntriesByPlacement,
  isFeaturePlacement,
  type FeaturePlacement,
  type FeatureRegistryResponse
} from "@moyuxia/shared";

@Controller("feature-registry")
export class FeatureRegistryController {
  @Get(":placement")
  getByPlacement(@Param("placement") placement: string): FeatureRegistryResponse {
    if (!isFeaturePlacement(placement)) {
      throw new BadRequestException(`Invalid feature registry placement: ${placement}`);
    }

    return getFeatureEntriesByPlacement(placement as FeaturePlacement);
  }
}
