<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import VisualStatePanel from "../../components/VisualStatePanel.vue";
import {
  SupplySectionKey,
  SupplyClickJumpStatus,
  type PublicSupplyItem,
  type PublicSupplySection
} from "@moyuxia/shared";
import {
  createSupplyClick,
  getLocalSupplyCenterPreview,
  getSupplyCenterList,
  normalizeSupplyCenterError
} from "../../services/supply-center";
import { SUPPLY_COVER_IMAGE } from "../../services/static-covers";
import { resolveSemanticIconPath } from "../../visual-system/illustration-registry";

const { visualModeClass } = useVisualModePage();

const sections = ref<PublicSupplySection[]>([]);
const mainRecommendation = ref<PublicSupplyItem | null>(null);
const scenarioLabel = ref("上班补给");
const loading = ref(false);
const message = ref("订单同步成功后会自动进入生存账本");
const clickFeedback = ref("");
const busyItemId = ref("");
const loadError = ref("");
const linkFailureMessage = ref("");

const visibleSections = computed(() => sections.value);
const hasAnySupply = computed(() =>
  visibleSections.value.some((section) => section.items.length > 0)
);

onShow(() => {
  void loadSupplyCenter();
});

const loadSupplyCenter = async () => {
  loading.value = true;
  try {
    const response = await getSupplyCenterList();
    sections.value = response.sections;
    mainRecommendation.value = response.mainRecommendation ?? null;
    scenarioLabel.value = response.todayPanel.scenarioLabel;
    message.value = response.syncHint;
    loadError.value = "";
  } catch (error) {
    const fallback = getLocalSupplyCenterPreview();
    const text = normalizeSupplyCenterError(error);
    sections.value = fallback.sections;
    mainRecommendation.value = fallback.mainRecommendation ?? null;
    scenarioLabel.value = fallback.todayPanel.scenarioLabel;
    loadError.value = text;
    message.value = fallback.syncHint;
  } finally {
    loading.value = false;
  }
};

const handleSupplyTap = async (item: PublicSupplyItem) => {
  busyItemId.value = item.id;
  clickFeedback.value = "正在准备补给通道";
  linkFailureMessage.value = "";
  try {
    const response = await createSupplyClick(item.id);
    clickFeedback.value = response.ledgerHint;

    if (canOpenJump(response.jumpStatus) && response.jumpTarget) {
      uni.showToast({ title: response.message, icon: "none" });
      openJumpTarget(response.jumpTarget);
      return;
    }

    linkFailureMessage.value = "当前补给通道暂时不可用，可以稍后重试。";
    clickFeedback.value = linkFailureMessage.value;
    uni.showToast({ title: linkFailureMessage.value, icon: "none" });
  } catch (error) {
    normalizeSupplyCenterError(error);
    linkFailureMessage.value = "补给通道暂时不可用，可以稍后重试。";
    clickFeedback.value = linkFailureMessage.value;
    uni.showToast({ title: linkFailureMessage.value, icon: "none" });
  } finally {
    busyItemId.value = "";
  }
};

function openJumpTarget(
  target: NonNullable<Awaited<ReturnType<typeof createSupplyClick>>["jumpTarget"]>
) {
  if (target.type === "miniapp") {
    uni.navigateToMiniProgram({
      appId: target.appId,
      path: target.path,
      fail: () => {
        if (target.fallbackUrl) {
          uni.navigateTo({
            url: `/pages/webview/index?url=${encodeURIComponent(target.fallbackUrl)}`
          });
          return;
        }

        linkFailureMessage.value = "当前环境无法打开补给通道，可以返回补给列表稍后重试。";
        clickFeedback.value = linkFailureMessage.value;
        uni.showToast({ title: "补给通道暂不可用", icon: "none" });
      }
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(target.url)}`
  });
}

function canOpenJump(status: SupplyClickJumpStatus): boolean {
  return (
    status === SupplyClickJumpStatus.Linked ||
    status === SupplyClickJumpStatus.FallbackLinked ||
    status === SupplyClickJumpStatus.Reused
  );
}

function sectionIconPath(sectionKey: string): string {
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return resolveSemanticIconPath("px-icon-supply-afternoon");
  }

  if (sectionKey === SupplySectionKey.Commute) {
    return resolveSemanticIconPath("px-icon-supply-commute");
  }

  return resolveSemanticIconPath("px-icon-supply-canteen");
}

function sectionToneClass(sectionKey: string): string {
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return "section-afternoon";
  }

  if (sectionKey === SupplySectionKey.Commute) {
    return "section-commute";
  }

  return "section-canteen";
}
</script>

<template>
  <view :class="['vs-page', 'supply-page', visualModeClass]">
    <view class="panel-head">
      <text class="vs-title page-title">今日补给面板</text>
      <text class="page-subtitle">{{ scenarioLabel }} · 订单同步后才会自动收纳到账本</text>
    </view>

    <view class="supply-cover-frame">
      <image class="supply-cover-image" :src="SUPPLY_COVER_IMAGE" mode="aspectFit" />
    </view>

    <VisualStatePanel
      v-if="loadError"
      state="degraded"
      title="补给铺暂时离线"
      :description="`${loadError}，已展示本地补给预览。`"
      action-text="重试同步"
      @action="loadSupplyCenter"
    />

    <VisualStatePanel v-if="loading" state="loading" title="补给面板同步中" />

    <view v-else class="supply-content">
      <view
        v-if="mainRecommendation"
        class="main-recommendation vs-pixel-frame-primary vs-pixel-frame-gold"
      >
        <view class="recommend-copy">
          <text class="eyebrow">主推荐</text>
          <text class="recommend-title">{{ mainRecommendation.title }}</text>
          <text class="recommend-desc">{{ mainRecommendation.description }}</text>
          <view class="tag-row">
            <text v-for="tag in mainRecommendation.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
        <button
          class="recommend-action"
          :disabled="!mainRecommendation.clickable || busyItemId === mainRecommendation.id"
          @tap="handleSupplyTap(mainRecommendation)"
        >
          <text class="supply-action-label">
            {{ busyItemId === mainRecommendation.id ? "准备中" : mainRecommendation.actionText }}
          </text>
          <view class="supply-action-icon" aria-hidden="true" />
        </button>
      </view>

      <VisualStatePanel
        v-else
        state="supply_unavailable"
        title="当前场景暂未上架补给"
        description="运营还没挂上今日补给，稍后可重新同步。"
        @action="loadSupplyCenter"
      />

      <VisualStatePanel
        v-if="linkFailureMessage"
        state="supply_link_failed"
        :description="linkFailureMessage"
        action-text="重新同步"
        @action="loadSupplyCenter"
      />

      <view
        v-for="section in visibleSections"
        :key="section.section.key"
        :class="['section', sectionToneClass(section.section.key)]"
      >
        <view class="section-head">
          <image
            class="section-icon"
            :src="sectionIconPath(section.section.key)"
            mode="aspectFit"
          />
          <view class="section-info">
            <text class="section-title">{{ section.section.title }}</text>
            <text class="section-desc">{{ section.section.description }}</text>
          </view>
          <view class="section-line" />
        </view>

        <VisualStatePanel
          v-if="section.items.length === 0"
          state="supply_unavailable"
          title="该板块暂未上架补给"
          description="当前板块没有可展示补给，稍后可重新同步。"
          :framed="false"
          compact
          @action="loadSupplyCenter"
        />

        <view v-else class="item-list">
          <view
            v-for="item in section.items"
            :key="item.id"
            :class="[
              'supply-item',
              sectionToneClass(section.section.key),
              'vs-card-pressable',
              item.recommendedNow ? 'supply-item-hot' : '',
              !item.clickable || busyItemId === item.id ? 'supply-item-disabled' : ''
            ]"
            @tap="item.clickable && busyItemId !== item.id ? handleSupplyTap(item) : undefined"
          >
            <view class="item-copy">
              <view class="item-title-row">
                <text class="item-title">{{ item.title }}</text>
                <text v-if="item.recommendedNow" class="hot-label">当前推荐</text>
              </view>
              <text class="item-desc">{{ item.description }}</text>
              <view class="tag-row">
                <text v-for="tag in item.tags" :key="`${item.id}-${tag}`" class="tag">
                  {{ tag }}
                </text>
              </view>
            </view>
            <view class="item-action">
              <text class="supply-action-label">
                {{ busyItemId === item.id ? "准备中" : item.actionText }}
              </text>
              <view class="supply-action-icon" aria-hidden="true" />
            </view>
          </view>
        </view>
      </view>

      <VisualStatePanel
        v-if="!hasAnySupply"
        state="supply_unavailable"
        title="今日补给暂未开张"
        description="运营还没挂上今日补给，稍后再来看看。"
        @action="loadSupplyCenter"
      />
    </view>

    <view class="sync-panel">
      <text>{{ clickFeedback || message }}</text>
    </view>
  </view>
</template>

<style scoped>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.supply-page {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.page-title {
  color: var(--camp-text-strong);
}

.page-subtitle,
.section-desc,
.sync-panel {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.5;
}

.supply-cover-frame {
  position: relative;
  width: 100%;
  height: 0;
  padding-top: 44.44%;
  overflow: hidden;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
}

.supply-cover-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.supply-content,
.section,
.item-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.section {
  padding: 4rpx 0 8rpx;
}

.section-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12rpx;
  padding: 2rpx 4rpx 0;
}

.section-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.section-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2rpx;
}

.section-line {
  width: 120rpx;
  height: 2rpx;
  flex-shrink: 0;
  opacity: 0.72;
}

.section-canteen .section-line {
  background: linear-gradient(90deg, rgba(255, 190, 92, 0.76), transparent);
}

.section-afternoon .section-line {
  background: linear-gradient(90deg, rgba(105, 255, 219, 0.76), transparent);
}

.section-commute .section-line {
  background: linear-gradient(90deg, rgba(144, 190, 255, 0.72), transparent);
}

.error-panel {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border-color: rgba(154, 106, 22, 0.32);
  background: rgba(154, 106, 22, 0.08);
}

.error-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.error-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}

.error-text {
  color: #b5bad1;
  font-size: 22rpx;
  line-height: 1.45;
}

.retry-action {
  flex-shrink: 0;
  min-width: 132rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  color: var(--vs-button-text);
  background: var(--vs-button-bg);
  font-family: var(--vs-font-display);
  font-size: 23rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(17, 24, 39, 0.72);
}

.main-recommendation {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 188rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(154, 106, 22, 0.36);
  border-radius: 8rpx;
  background: var(--camp-surface);
}

.recommend-title,
.section-title,
.item-title {
  color: var(--camp-text-strong);
  font-weight: 900;
}

.section-title {
  font-size: 28rpx;
  line-height: 1.18;
}

.section-desc {
  font-size: 20rpx;
  line-height: 1.3;
}

.recommend-desc,
.item-desc {
  color: var(--camp-text-muted);
  font-size: 23rpx;
  line-height: 1.45;
}

.eyebrow,
.hot-label {
  color: var(--camp-gold);
  font-size: 20rpx;
  font-weight: 900;
}

.hot-label {
  color: #f7a516;
}

.recommend-action,
.item-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  flex-shrink: 0;
  min-width: 104rpx;
  padding: 8rpx 16rpx;
  border: 2rpx solid rgba(255, 253, 248, 0.64);
  border-radius: 4rpx;
  background: rgba(255, 253, 248, 0.18);
  --supply-action-icon-color: #fff6c7;
  color: #fff6c7;
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.2;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.14),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.16);
}

.recommend-action {
  display: flex;
  margin: 0;
}

.supply-action-label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.supply-action-icon {
  display: inline-flex;
  width: 12rpx;
  height: 12rpx;
  flex-shrink: 0;
  border-top: 3rpx solid var(--supply-action-icon-color, #fff6c7);
  border-right: 3rpx solid var(--supply-action-icon-color, #fff6c7);
  transform: rotate(45deg);
}

.supply-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 124rpx;
  overflow: hidden;
  padding: 20rpx 18rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 8rpx;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.14),
    inset 0 -8rpx 0 rgba(0, 0, 0, 0.14),
    0 8rpx 14rpx rgba(0, 0, 0, 0.24);
}

.supply-item::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: "";
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1rpx, transparent 1rpx),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05) 1rpx, transparent 1rpx);
  background-size: 16rpx 16rpx;
  opacity: 0.34;
}

.supply-item.section-canteen {
  border-color: rgba(255, 190, 92, 0.46);
  background:
    linear-gradient(135deg, rgba(255, 214, 119, 0.18), transparent 42%),
    linear-gradient(160deg, #a5621a 0%, #88440f 58%, #5f2f0f 100%);
}

.supply-item.section-afternoon {
  border-color: rgba(102, 255, 214, 0.42);
  background:
    linear-gradient(135deg, rgba(105, 255, 219, 0.16), transparent 42%),
    linear-gradient(160deg, #127c72 0%, #0b5d5a 58%, #073f44 100%);
}

.supply-item.section-commute {
  border-color: rgba(144, 190, 255, 0.42);
  background:
    linear-gradient(135deg, rgba(144, 190, 255, 0.18), transparent 42%),
    linear-gradient(160deg, #315f8d 0%, #25476f 56%, #182d4a 100%);
}

.vs-mode-workplace .supply-item {
  border-width: 1rpx;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    inset 0 -8rpx 18rpx rgba(255, 255, 255, 0.18),
    0 8rpx 18rpx rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .supply-item.section-canteen {
  border-color: rgba(218, 114, 15, 0.58);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(160deg, #e28324 0%, #da720f 56%, #c5640d 100%);
}

.vs-mode-workplace .supply-item.section-afternoon {
  border-color: rgba(21, 197, 176, 0.58);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(160deg, #28d0bd 0%, #15c5b0 56%, #10ad9d 100%);
}

.vs-mode-workplace .supply-item.section-commute {
  border-color: rgba(64, 130, 199, 0.56);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(160deg, #4e94d6 0%, #327cc5 56%, #2468a9 100%);
}

.vs-mode-workplace .supply-item::before {
  background:
    linear-gradient(90deg, rgba(17, 24, 39, 0.13) 1rpx, transparent 1rpx),
    linear-gradient(180deg, rgba(17, 24, 39, 0.1) 1rpx, transparent 1rpx);
  background-size: 16rpx 16rpx;
  opacity: 0.44;
}

.recommend-copy,
.recommend-action,
.item-copy,
.item-action {
  position: relative;
  z-index: 1;
}

.recommend-copy,
.item-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.item-title-row,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
}

.supply-item-hot {
  border-color: rgba(154, 106, 22, 0.68);
}

.tag {
  padding: 4rpx 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.26);
  border-radius: 4rpx;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(0, 0, 0, 0.16);
  font-size: 19rpx;
  line-height: 1.2;
}

.vs-mode-workplace .supply-item .item-title {
  color: #052f2c;
  text-shadow: none;
}

.vs-mode-workplace .supply-item .item-desc {
  color: rgba(5, 47, 44, 0.88);
  font-weight: 800;
  text-shadow: none;
}

.vs-mode-workplace .supply-item.section-canteen .item-title {
  color: #3d1d06;
}

.vs-mode-workplace .supply-item.section-canteen .item-desc {
  color: rgba(61, 29, 6, 0.86);
}

.vs-mode-workplace .supply-item.section-commute .item-title {
  color: #102f52;
}

.vs-mode-workplace .supply-item.section-commute .item-desc {
  color: rgba(16, 47, 82, 0.86);
}

.vs-mode-workplace .supply-item .tag {
  border-color: rgba(255, 253, 248, 0.5);
  background: rgba(255, 253, 248, 0.24);
  color: rgba(5, 47, 44, 0.82);
}

.vs-mode-workplace .supply-item.section-canteen .tag {
  color: rgba(61, 29, 6, 0.82);
}

.vs-mode-workplace .supply-item.section-commute .tag {
  color: rgba(16, 47, 82, 0.82);
}

.vs-mode-workplace .supply-item .hot-label,
.vs-mode-workplace .supply-item .item-action {
  --supply-action-icon-color: #052f2c;
  color: #052f2c;
  text-shadow: none;
}

.vs-mode-workplace .supply-item.section-canteen .hot-label,
.vs-mode-workplace .supply-item.section-canteen .item-action {
  --supply-action-icon-color: #3d1d06;
  color: #3d1d06;
}

.vs-mode-workplace .supply-item.section-commute .hot-label,
.vs-mode-workplace .supply-item.section-commute .item-action {
  --supply-action-icon-color: #102f52;
  color: #102f52;
}

.vs-mode-workplace .supply-item .item-action {
  border-color: rgba(255, 253, 248, 0.62);
  background: rgba(255, 253, 248, 0.36);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    0 4rpx 10rpx rgba(17, 24, 39, 0.08);
}

.vs-mode-workplace .main-recommendation {
  border-color: rgba(154, 106, 22, 0.42) !important;
  background:
    linear-gradient(135deg, rgba(154, 106, 22, 0.11), rgba(47, 111, 115, 0.06)), var(--camp-card) !important;
}

.vs-mode-workplace .main-recommendation .eyebrow {
  color: #9a6a16;
}

.vs-mode-workplace .main-recommendation .recommend-title {
  color: var(--camp-text-strong);
}

.vs-mode-workplace .main-recommendation .recommend-desc {
  color: var(--camp-text-muted);
}

.vs-mode-workplace .main-recommendation .tag {
  border-color: rgba(154, 106, 22, 0.26);
  background: rgba(154, 106, 22, 0.1);
  color: #9a6a16;
}

.vs-mode-workplace .main-recommendation .recommend-action {
  --supply-action-icon-color: #17130f;
  color: #17130f;
}

.vs-mode-workplace .main-recommendation .recommend-action[disabled] {
  --supply-action-icon-color: var(--camp-text-muted);
  border-color: var(--camp-border);
  background: var(--camp-surface-high);
  color: var(--camp-text-muted);
  box-shadow: none;
}

.sync-panel {
  padding: 0 8rpx 12rpx;
  text-align: center;
}
</style>
