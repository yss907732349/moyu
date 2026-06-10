<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import PixelHeroFrame from "../../components/PixelHeroFrame.vue";
import VisualStatePanel from "../../components/VisualStatePanel.vue";
import {
  BUILTIN_SURVIVAL_LEDGER_CATEGORIES,
  formatDisplayTime,
  SurvivalLedgerCategoryKey,
  type SurvivalLedgerBillSnapshot,
  type SurvivalLedgerTodaySummaryResponse,
  type SurvivalLedgerWeeklyReportResponse
} from "@moyuxia/shared";
import {
  SURVIVAL_AFTERNOON_CARD_IMAGE,
  SURVIVAL_CANTEEN_CARD_IMAGE,
  SURVIVAL_COMMUTE_CARD_IMAGE,
  SURVIVAL_LEDGER_HERO_IMAGE
} from "../../services/static-covers";
import {
  getSurvivalLedgerTodaySummary,
  getSurvivalLedgerWeeklyReport,
  listSurvivalLedgerBills,
  normalizeAccountingLedgerError
} from "../../services/accounting-ledger";

const { visualModeClass } = useVisualModePage();

const bills = ref<SurvivalLedgerBillSnapshot[]>([]);
const todaySummary = ref<SurvivalLedgerTodaySummaryResponse | null>(null);
const weeklyReport = ref<SurvivalLedgerWeeklyReportResponse | null>(null);
const loading = ref(false);
const feedbackMessage = ref("");
const selectedBill = ref<SurvivalLedgerBillSnapshot | null>(null);

const visibleBills = computed(() => bills.value);
const emptyMoneyText = "¥0.00";
const totalAmountText = computed(() => {
  if (todaySummary.value) {
    return formatMoney(todaySummary.value.totalAmountMinor);
  }

  return feedbackMessage.value ? "待同步" : emptyMoneyText;
});
const summaryCategories = computed(() => {
  if (!todaySummary.value && feedbackMessage.value) {
    return [];
  }

  const categories =
    todaySummary.value?.categories ??
    BUILTIN_SURVIVAL_LEDGER_CATEGORIES.map((category) => ({
      categoryKey: category.key,
      displayName: category.displayName,
      amountMinor: 0,
      orderCount: 0
    }));

  return categories;
});
const commuteDistanceText = computed(() => {
  if (feedbackMessage.value && !weeklyReport.value) {
    return "--";
  }

  if (!weeklyReport.value) {
    return "--";
  }

  if (
    !weeklyReport.value.commuteDistanceReliable ||
    weeklyReport.value.commuteDistanceMeters === null
  ) {
    return `${weeklyReport.value.commuteOrderCount} 次`;
  }

  return `${(weeklyReport.value.commuteDistanceMeters / 1000).toFixed(1)} km`;
});

onShow(() => {
  void refreshLedger();
});

async function refreshLedger(): Promise<void> {
  loading.value = true;
  feedbackMessage.value = "";

  try {
    const businessDate = todayBusinessDate();
    const [summaryResponse, reportResponse, listResponse] = await Promise.all([
      getSurvivalLedgerTodaySummary(businessDate),
      getSurvivalLedgerWeeklyReport(businessDate),
      listSurvivalLedgerBills({
        startDate: monthStart(),
        endDate: monthEnd()
      })
    ]);
    todaySummary.value = summaryResponse;
    weeklyReport.value = reportResponse;
    bills.value = listResponse.bills;
  } catch (error) {
    feedbackMessage.value = normalizeAccountingLedgerError(error).message;
  } finally {
    loading.value = false;
  }
}

function openBillDetail(bill: SurvivalLedgerBillSnapshot): void {
  selectedBill.value = bill;
}

function closeBillDetail(): void {
  selectedBill.value = null;
}

function formatMoney(amountMinor: number): string {
  return `¥${(amountMinor / 100).toFixed(2)}`;
}

function categoryName(categoryKey: string): string {
  return (
    BUILTIN_SURVIVAL_LEDGER_CATEGORIES.find((category) => category.key === categoryKey)
      ?.displayName ?? "隐者食堂"
  );
}

function categoryArtworkImage(categoryKey: string): string {
  if (categoryKey === SurvivalLedgerCategoryKey.AfternoonBoost) {
    return SURVIVAL_AFTERNOON_CARD_IMAGE;
  }

  if (categoryKey === SurvivalLedgerCategoryKey.Commute) {
    return SURVIVAL_COMMUTE_CARD_IMAGE;
  }

  return SURVIVAL_CANTEEN_CARD_IMAGE;
}

function displayStatusText(bill: SurvivalLedgerBillSnapshot): string {
  if (bill.countsTowardConsumption) {
    return "已计入";
  }

  if (bill.displayStatus === "pending") {
    return "待同步";
  }

  if (bill.displayStatus === "rolled_back") {
    return "已失效";
  }

  return "未计入";
}

function todayBusinessDate(): string {
  return formatBusinessDate(new Date());
}

function monthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthEnd(): string {
  const now = new Date();
  return formatBusinessDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

function formatBusinessDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', 'ledger-page', visualModeClass]">
    <view class="vs-panel vs-hero-frame-host stats-card">
      <image class="stats-card-bg" :src="SURVIVAL_LEDGER_HERO_IMAGE" mode="aspectFill" />
      <view class="stats-card-shade" />
      <PixelHeroFrame />
      <view class="stats-card-content">
        <view class="vs-row-between">
          <text class="page-title">生存账本</text>
          <text class="loading-text">{{ loading ? "同步中" : "订单自动同步" }}</text>
        </view>
        <view class="total-row">
          <text class="stat-label">今日生存消耗</text>
          <text class="total-value">{{ totalAmountText }}</text>
        </view>
        <view class="stats-grid">
          <view v-for="item in summaryCategories" :key="item.categoryKey" class="stat-item">
            <image
              class="stat-item-bg"
              :src="categoryArtworkImage(item.categoryKey)"
              mode="aspectFill"
            />
            <view class="stat-item-shade" />
            <view class="stat-item-copy">
              <text class="stat-label">{{ item.displayName }}</text>
              <text class="stat-value">{{ formatMoney(item.amountMinor) }}</text>
              <text class="stat-extra">{{ item.orderCount }} 笔</text>
            </view>
          </view>
        </view>
        <VisualStatePanel
          v-if="feedbackMessage"
          state="network_failed"
          title="账本同步失败"
          :description="feedbackMessage"
          action-text="重试"
          :framed="false"
          compact
          @action="refreshLedger"
        />
      </view>
    </view>

    <view class="vs-panel vs-card-raised report-card">
      <text class="section-title">本周生存报告</text>
      <view class="report-strip">
        <view class="report-metric canteen-report">
          <text class="stat-label">食堂补给</text>
          <text class="stat-value">
            {{ feedbackMessage && !weeklyReport ? "--" : (weeklyReport?.canteenOrderCount ?? 0) }}
            次
          </text>
        </view>
        <view class="report-metric boost-report">
          <text class="stat-label">下午续命</text>
          <text class="stat-value">
            {{ feedbackMessage && !weeklyReport ? "--" : (weeklyReport?.afternoonBoostCount ?? 0) }}
            次
          </text>
        </view>
        <view class="report-metric commute-report">
          <text class="stat-label">影遁通勤</text>
          <text class="stat-value">{{ commuteDistanceText }}</text>
        </view>
      </view>
      <text class="ranking-note">
        {{ weeklyReport?.rankingPlaceholder.text ?? "击败百分比待排行榜能力开放后计算" }}
      </text>
    </view>

    <view class="vs-panel vs-card-raised list-card">
      <view class="vs-row-between">
        <text class="section-title">近期订单详情</text>
        <text class="loading-text">{{ loading ? "读取中" : `${visibleBills.length} 笔` }}</text>
      </view>

      <VisualStatePanel
        v-if="loading && visibleBills.length === 0"
        state="loading"
        title="订单同步中"
        description="正在读取今日摘要、近期订单和本周报告。"
        :framed="false"
        compact
      />

      <VisualStatePanel
        v-else-if="!feedbackMessage && visibleBills.length === 0"
        state="orders_not_synced"
        title="暂无同步到的生存消耗"
        description="订单同步后会自动归类到隐者食堂、下午续命和通勤。"
        :framed="false"
        compact
        @action="refreshLedger"
      />

      <view
        v-for="bill in visibleBills"
        :key="bill.id"
        class="bill-row"
        @tap="openBillDetail(bill)"
      >
        <view class="bill-main">
          <text class="bill-title">{{ bill.displayTitle }}</text>
          <text class="bill-meta">
            {{ categoryName(bill.categoryKey) }} · {{ bill.occurredOn }} ·
            {{ displayStatusText(bill) }}
          </text>
        </view>
        <view class="bill-side">
          <text
            :class="[
              'bill-amount',
              bill.categoryKey === SurvivalLedgerCategoryKey.AfternoonBoost
                ? 'boost-color'
                : bill.categoryKey === SurvivalLedgerCategoryKey.Commute
                  ? 'commute-color'
                  : 'canteen-color'
            ]"
          >
            {{ formatMoney(bill.amountMinor) }}
          </text>
          <text class="detail-action">详情</text>
        </view>
      </view>
    </view>

    <view v-if="selectedBill" class="detail-mask" @tap="closeBillDetail">
      <view class="detail-panel vs-panel vs-card-raised" @tap.stop>
        <view class="vs-row-between">
          <text class="section-title">订单详情</text>
          <text class="close-action" @tap="closeBillDetail">关闭</text>
        </view>
        <view class="detail-field">
          <text class="field-label">标题</text>
          <text class="field-value">{{ selectedBill.displayTitle }}</text>
        </view>
        <view class="detail-field">
          <text class="field-label">分类</text>
          <text class="field-value">{{ categoryName(selectedBill.categoryKey) }}</text>
        </view>
        <view class="detail-field">
          <text class="field-label">金额</text>
          <text class="field-value amount-value">{{ formatMoney(selectedBill.amountMinor) }}</text>
        </view>
        <view class="detail-field">
          <text class="field-label">发生时间</text>
          <text class="field-value">{{ formatDisplayTime(selectedBill.occurredAt) }}</text>
        </view>
        <view class="detail-field">
          <text class="field-label">状态</text>
          <text class="field-value">{{ displayStatusText(selectedBill) }}</text>
        </view>
        <view v-if="selectedBill.displayStatusReason" class="detail-field">
          <text class="field-label">说明</text>
          <text class="field-value">{{ selectedBill.displayStatusReason }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.ledger-page {
  gap: 16rpx;
}

.stats-card {
  position: relative;
  min-height: 366rpx;
  overflow: hidden;
}

.stats-card-content,
.report-card,
.list-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.stats-card-content {
  position: relative;
  z-index: 2;
}

.stats-card-bg,
.stats-card-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 14rpx;
}

.stats-card-bg {
  z-index: 0;
}

.stats-card-shade {
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      var(--camp-asset-shade-strong) 0%,
      var(--camp-asset-shade-medium) 42%,
      var(--camp-asset-shade-soft) 100%
    ),
    linear-gradient(
      180deg,
      var(--camp-asset-shade-soft) 0%,
      var(--camp-asset-shade-medium) 42%,
      var(--camp-asset-shade-medium) 100%
    );
}

.page-title,
.section-title {
  color: var(--camp-text-strong);
  font-size: 32rpx;
  font-weight: 900;
  text-shadow: 0 2rpx 6rpx var(--camp-image-text-shadow);
}

.section-title {
  font-size: 26rpx;
}

.total-row {
  display: flex;
  min-height: 96rpx;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.total-value {
  color: var(--camp-gold);
  font-size: 46rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.report-strip {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1rpx solid rgba(236, 178, 255, 0.18);
  border-bottom: 1rpx solid rgba(236, 178, 255, 0.18);
  background:
    linear-gradient(90deg, rgba(236, 178, 255, 0.08), rgba(0, 219, 233, 0.04)),
    rgba(11, 11, 18, 0.28);
  box-sizing: border-box;
}

.report-metric {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 56rpx;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 10rpx 4rpx 10rpx 22rpx;
  box-sizing: border-box;
}

.report-metric + .report-metric {
  border-top: 1rpx solid rgba(236, 178, 255, 0.12);
}

.report-metric::before {
  content: "";
  position: absolute;
  left: 4rpx;
  top: 50%;
  width: 4rpx;
  height: 26rpx;
  background: var(--camp-gold);
  box-shadow: 0 0 8rpx rgba(154, 106, 22, 0.42);
  transform: translateY(-50%);
}

.boost-report::before {
  background: var(--camp-primary);
  box-shadow: 0 0 8rpx rgba(236, 178, 255, 0.42);
}

.commute-report::before {
  background: var(--camp-cyan);
  box-shadow: 0 0 8rpx rgba(0, 219, 233, 0.42);
}

.stat-item {
  position: relative;
  display: flex;
  min-height: 118rpx;
  overflow: hidden;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8rpx;
  border: 1rpx solid rgba(255, 224, 154, 0.44);
  border-radius: 8rpx;
  padding: 14rpx;
  background: rgba(28, 17, 14, 0.72);
  box-sizing: border-box;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 236, 192, 0.28),
    0 6rpx 14rpx rgba(0, 0, 0, 0.28);
}

.stat-item-bg,
.stat-item-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.stat-item-bg {
  z-index: 0;
}

.stat-item-shade {
  z-index: 1;
  background:
    linear-gradient(
      180deg,
      var(--camp-asset-shade-soft) 0%,
      var(--camp-asset-shade-medium) 46%,
      var(--camp-asset-shade-medium) 100%
    ),
    linear-gradient(90deg, var(--camp-asset-shade-medium), var(--camp-asset-shade-soft));
}

.stat-item-copy {
  position: relative;
  z-index: 2;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.stat-label,
.loading-text,
.bill-meta,
.stat-extra,
.ranking-note {
  color: var(--camp-text-soft);
  font-size: 20rpx;
}

.stats-card .stat-label,
.stats-card .loading-text,
.stats-card .stat-extra {
  text-shadow: 0 2rpx 5rpx var(--camp-image-text-shadow);
}

.stat-value {
  color: var(--camp-gold);
  font-size: 28rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
  text-shadow: 0 2rpx 6rpx var(--camp-image-text-shadow);
}

.bill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 96rpx;
  border-bottom: 1rpx solid var(--camp-border);
}

.bill-row:last-child {
  border-bottom: none;
}

.bill-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.bill-title {
  display: block;
  max-width: 100%;
  color: var(--camp-text-strong);
  font-size: 24rpx;
  font-weight: 900;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.bill-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  flex-shrink: 0;
}

.bill-amount {
  font-size: 24rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
}

.canteen-color {
  color: var(--camp-gold);
}
.boost-color {
  color: var(--camp-primary);
}
.commute-color {
  color: var(--camp-cyan);
}

.detail-action,
.feedback-text {
  color: var(--camp-gold);
  font-size: 20rpx;
}

.detail-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background: var(--camp-overlay);
}

.detail-panel {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  border-radius: 8rpx 8rpx 0 0 !important;
  box-sizing: border-box;
}

.close-action {
  color: var(--camp-text-soft);
  font-size: 22rpx;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.field-label {
  color: var(--camp-primary);
  font-size: 22rpx;
  font-weight: 900;
}

.field-value {
  display: block;
  max-width: 100%;
  min-height: 56rpx;
  color: var(--camp-text);
  font-size: 24rpx;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.amount-value {
  color: var(--camp-gold);
  font-size: 34rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
}

.vs-mode-workplace .stats-card {
  background: #090c18 !important;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 236, 176, 0.08),
    inset 0 -18rpx 28rpx rgba(0, 0, 0, 0.18),
    0 8rpx 0 rgba(17, 24, 39, 0.18),
    0 18rpx 28rpx rgba(17, 24, 39, 0.2) !important;
}

.vs-mode-workplace .stats-card-shade,
.vs-mode-workplace .stat-item-shade {
  display: none;
}

.vs-mode-workplace .stats-card .vs-hero-frame-edge {
  background: linear-gradient(180deg, #9a6a16 0%, #9a6a16 58%, #9a6a16 100%);
  opacity: 0.92;
}

.vs-mode-workplace .stats-card .vs-hero-frame-corner {
  box-shadow:
    16rpx 0 0 #9a6a16,
    24rpx 0 0 #9a6a16,
    8rpx 8rpx 0 #9a6a16,
    16rpx 8rpx 0 #9a6a16,
    24rpx 8rpx 0 #9a6a16,
    0 16rpx 0 #9a6a16,
    8rpx 16rpx 0 #9a6a16,
    16rpx 16rpx 0 #9a6a16,
    24rpx 16rpx 0 #111827,
    0 24rpx 0 #9a6a16,
    8rpx 24rpx 0 #9a6a16,
    16rpx 24rpx 0 #111827;
}

.vs-mode-workplace .stats-card .page-title,
.vs-mode-workplace .stats-card .stat-label,
.vs-mode-workplace .stats-card .loading-text,
.vs-mode-workplace .stats-card .stat-extra {
  color: rgba(255, 255, 255, 0.86);
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.64);
}

.vs-mode-workplace .stats-card .page-title {
  color: rgba(255, 255, 255, 0.96);
}

.vs-mode-workplace .stats-card .total-value,
.vs-mode-workplace .stats-card .stat-value {
  color: #ffe7a3;
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.64);
}

.vs-mode-workplace .stat-item {
  border-color: rgba(255, 224, 154, 0.44);
  background: transparent;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.14),
    0 6rpx 14rpx rgba(0, 0, 0, 0.2);
}

.vs-mode-workplace .report-strip {
  border-top-color: rgba(216, 201, 180, 0.86);
  border-bottom-color: rgba(216, 201, 180, 0.86);
  background: rgba(255, 253, 248, 0.72);
}

.vs-mode-workplace .report-card .stat-label,
.vs-mode-workplace .report-card .ranking-note {
  color: var(--camp-text-muted);
  text-shadow: none;
}

.vs-mode-workplace .report-card .stat-value {
  text-shadow: none;
}
</style>
