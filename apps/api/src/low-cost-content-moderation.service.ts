import { Injectable } from "@nestjs/common";
import {
  LowCostModerationRiskTag,
  moderateWithLowCostRules,
  type LowCostContentModerationInputField,
  type LowCostContentModerationResult
} from "@moyuxia/shared";
import { API_SENSITIVE_LEXICON_CACHE } from "./content-moderation/sensitive-lexicon.data";

@Injectable()
export class LowCostContentModerationService {
  moderateFields(input: {
    fields: readonly LowCostContentModerationInputField[];
    extraRiskTags?: readonly LowCostModerationRiskTag[];
  }): LowCostContentModerationResult {
    return moderateWithLowCostRules({
      fields: input.fields,
      lexicon: API_SENSITIVE_LEXICON_CACHE,
      extraRiskTags: input.extraRiskTags
    });
  }
}
