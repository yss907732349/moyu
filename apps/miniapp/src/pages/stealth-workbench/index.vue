<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, onUnmounted, ref } from "vue";
import { onHide, onShow } from "@dcloudio/uni-app";
import {
  DEFAULT_STATUTORY_HOLIDAY_CALENDAR,
  getNextStatutoryHoliday,
  HolidayQueryStatus,
  SurvivalLedgerCategoryKey,
  WorkProfileConfigStatus,
  WorkStatus,
  calculateWorkValueState,
  type SurvivalLedgerCategoryAmount,
  type WorkProfileSnapshot,
  type WorkValueState
} from "@moyuxia/shared";
import {
  resolveMiniappFirstRunState,
  type MiniappFirstRunState
} from "../../services/first-run-flow";
import { getLocalWorkProfileSnapshot } from "../../services/work-profile";
import { getSurvivalLedgerTodaySummary } from "../../services/accounting-ledger";
const { visualModeClass } = useVisualModePage({ forceMode: "workplace" });

type SurvivalRow = {
  categoryKey: SurvivalLedgerCategoryKey;
  label: string;
  amountText: string;
  orderCount: number;
};

let timer: ReturnType<typeof setInterval> | null = null;

const firstRunState = ref<MiniappFirstRunState>("logged_out");
const snapshot = ref<WorkProfileSnapshot | null>(null);
const workValueState = ref<WorkValueState>(
  calculateWorkValueState({ snapshot: null, now: new Date() })
);
const loading = ref(false);
const feedback = ref("同步中");
const survivalRows = ref<SurvivalRow[]>(createEmptySurvivalRows());
const survivalFeedback = ref("同步中");

const readyWithSnapshot = computed(
  () =>
    firstRunState.value === "ready" &&
    snapshot.value !== null &&
    workValueState.value.configStatus === WorkProfileConfigStatus.Configured
);

const amountText = computed(() =>
  readyWithSnapshot.value ? workValueState.value.amountToday.toFixed(2) : "--"
);
const progressText = computed(() =>
  readyWithSnapshot.value ? `${Math.round(workValueState.value.workProgress * 100)}%` : "--"
);
const progressWidth = computed(
  () => `${Math.max(0, Math.min(100, Math.round(workValueState.value.workProgress * 100)))}%`
);
const remainingText = computed(() => {
  if (!readyWithSnapshot.value) {
    return "--";
  }

  const seconds = workValueState.value.countdowns.secondsUntilWorkEnd;
  if (!seconds || seconds <= 0) {
    return workValueState.value.status === WorkStatus.AfterWork ? "已完成" : "--";
  }

  return formatDuration(seconds);
});
const statusText = computed(() => {
  if (loading.value) {
    return "同步中";
  }

  if (!readyWithSnapshot.value) {
    return firstRunStateText(firstRunState.value);
  }

  switch (workValueState.value.status) {
    case WorkStatus.BeforeWork:
      return "未开始";
    case WorkStatus.Working:
      return "进行中";
    case WorkStatus.OnBreak:
      return "暂停";
    case WorkStatus.AfterWork:
      return "已完成";
    case WorkStatus.RestDay:
      return "非工作日";
    default:
      return "未配置";
  }
});
const countdownRows = computed(() => {
  const countdowns = workValueState.value.countdowns;
  const holiday = getNextStatutoryHoliday({
    calendar: DEFAULT_STATUTORY_HOLIDAY_CALENDAR,
    now: new Date()
  });

  return [
    {
      label: "距休息日",
      value: readyWithSnapshot.value ? formatCountdownValue(countdowns.secondsUntilRestDay) : "--",
      desc: readyWithSnapshot.value ? "工作日规则" : "待配置"
    },
    {
      label: "距发薪日",
      value: readyWithSnapshot.value ? formatCountdownValue(countdowns.secondsUntilPayday) : "--",
      desc: readyWithSnapshot.value ? "薪日规则" : "待配置"
    },
    {
      label: "距法定节日",
      value:
        holiday.status === HolidayQueryStatus.Available
          ? `${holiday.daysUntilStart}天`
          : holiday.status === HolidayQueryStatus.Ongoing
            ? "进行中"
            : "待同步",
      desc:
        holiday.status === HolidayQueryStatus.Available ||
        holiday.status === HolidayQueryStatus.Ongoing
          ? holiday.holiday.name
          : "节假日缓存"
    }
  ];
});

onShow(() => {
  void refreshWorkbench();
});

onHide(() => {
  stopTimer();
});

onUnmounted(() => {
  stopTimer();
});

async function refreshWorkbench(): Promise<void> {
  loading.value = true;
  feedback.value = "同步中";

  try {
    const result = await resolveMiniappFirstRunState();
    firstRunState.value = result.state;
    snapshot.value = getLocalWorkProfileSnapshot();

    if (result.state === "ready" && snapshot.value) {
      recalculate();
      startTimer();
      feedback.value = result.workProfileSyncMessage || "";
    } else {
      stopTimer();
      workValueState.value = calculateWorkValueState({ snapshot: null, now: new Date() });
      feedback.value = firstRunStateText(result.state);
    }

    await refreshSurvivalSummary();
  } catch (error) {
    snapshot.value = getLocalWorkProfileSnapshot();
    if (snapshot.value) {
      firstRunState.value = "ready";
      recalculate();
      startTimer();
      feedback.value = "数据读取失败，已使用本地记录";
    } else {
      firstRunState.value = "work_profile_missing";
      stopTimer();
      feedback.value = error instanceof Error ? error.message : "数据读取失败";
      workValueState.value = calculateWorkValueState({ snapshot: null, now: new Date() });
    }
    await refreshSurvivalSummary();
  } finally {
    loading.value = false;
  }
}

async function refreshSurvivalSummary(): Promise<void> {
  survivalFeedback.value = "同步中";
  try {
    const response = await getSurvivalLedgerTodaySummary(formatBusinessDate(new Date()));
    survivalRows.value = createSurvivalRows(response.categories);
    survivalFeedback.value = "";
  } catch {
    survivalRows.value = createEmptySurvivalRows();
    survivalFeedback.value = "待同步";
  }
}

function recalculate(): void {
  workValueState.value = calculateWorkValueState({ snapshot: snapshot.value, now: new Date() });
}

function startTimer(): void {
  stopTimer();
  timer = setInterval(recalculate, 1000);
}

function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function openDailyList(): void {
  uni.navigateTo({ url: "/pages/stealth-workbench/daily-list" });
}

function openForum(): void {
  uni.navigateTo({ url: "/pages/stealth-workbench/forum" });
}

function firstRunStateText(state: MiniappFirstRunState): string {
  if (state === "logged_out") {
    return "暂无身份记录";
  }

  if (state === "profile_missing") {
    return "暂无人员档案";
  }

  if (state === "work_profile_missing") {
    return "暂无工作数据";
  }

  return "暂无记录";
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatCountdownValue(seconds?: number): string {
  if (seconds === undefined || seconds <= 0) {
    return "--";
  }

  const days = Math.floor(seconds / 86400);
  if (days > 0) {
    return `${days}天`;
  }

  const hours = Math.floor(seconds / 3600);
  if (hours > 0) {
    return `${hours}小时`;
  }

  return `${Math.ceil(seconds / 60)}分钟`;
}

function createSurvivalRows(categories: SurvivalLedgerCategoryAmount[]): SurvivalRow[] {
  const byKey = new Map(categories.map((category) => [category.categoryKey, category]));
  return [
    toSurvivalRow(SurvivalLedgerCategoryKey.Canteen, "隐者食堂", byKey),
    toSurvivalRow(SurvivalLedgerCategoryKey.AfternoonBoost, "下午续命", byKey),
    toSurvivalRow(SurvivalLedgerCategoryKey.Commute, "通勤", byKey)
  ];
}

function createEmptySurvivalRows(): SurvivalRow[] {
  return createSurvivalRows([]);
}

function toSurvivalRow(
  categoryKey: SurvivalLedgerCategoryKey,
  label: string,
  byKey: Map<SurvivalLedgerCategoryKey, SurvivalLedgerCategoryAmount>
): SurvivalRow {
  const category = byKey.get(categoryKey);
  return {
    categoryKey,
    label,
    amountText: `¥${((category?.amountMinor ?? 0) / 100).toFixed(2)}`,
    orderCount: category?.orderCount ?? 0
  };
}

function formatBusinessDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
</script>

<template>
  <view :class="['stealth-page', visualModeClass]">
    <view class="stealth-stack">
      <view class="stealth-sheet stealth-field-table">
        <view class="stealth-sheet-title">
          <text>今日工作表</text>
          <text class="stealth-sheet-meta">{{ feedback || "已同步" }}</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">今日累计</text>
          <text class="stealth-cell stealth-text-strong">{{ amountText }}</text>
          <text class="stealth-cell stealth-cell-number">CNY</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">剩余时长</text>
          <text class="stealth-cell stealth-text-strong">{{ remainingText }}</text>
          <text class="stealth-cell stealth-cell-time">{{ statusText }}</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">今日进度</text>
          <view class="stealth-cell">
            <view class="stealth-progress-track">
              <view class="stealth-progress-bar" :style="{ width: progressWidth }" />
            </view>
          </view>
          <text class="stealth-cell stealth-cell-number">{{ progressText }}</text>
        </view>
      </view>

      <view v-if="!readyWithSnapshot" class="stealth-sheet">
        <view class="stealth-sheet-title">
          <text>状态</text>
          <text class="stealth-sheet-meta">暂无记录</text>
        </view>
        <text class="stealth-status-row">{{ feedback || "暂无工作数据" }}</text>
      </view>

      <view class="stealth-sheet stealth-countdown-table">
        <view class="stealth-sheet-title">
          <text>倒计时记录</text>
          <text class="stealth-sheet-meta">3 项</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">项目</text>
          <text class="stealth-cell">数值</text>
          <text class="stealth-cell stealth-cell-action">说明</text>
        </view>
        <view v-for="row in countdownRows" :key="row.label" class="stealth-row">
          <text class="stealth-cell">{{ row.label }}</text>
          <text class="stealth-cell stealth-text-strong">{{ row.value }}</text>
          <text class="stealth-cell stealth-cell-time">{{ row.desc }}</text>
        </view>
      </view>

      <view class="stealth-sheet stealth-entry-table">
        <view class="stealth-sheet-title">
          <text>今日生存消耗</text>
          <text class="stealth-sheet-meta">{{ survivalFeedback || "已同步" }}</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">分类</text>
          <text class="stealth-cell">金额</text>
          <text class="stealth-cell stealth-cell-action">订单</text>
        </view>
        <view v-for="row in survivalRows" :key="row.categoryKey" class="stealth-row">
          <text class="stealth-cell">{{ row.label }}</text>
          <text class="stealth-cell stealth-text-strong">{{ row.amountText }}</text>
          <text class="stealth-cell stealth-cell-number">{{ row.orderCount }}</text>
        </view>
      </view>

      <view class="stealth-sheet stealth-entry-table">
        <view class="stealth-sheet-title">
          <text>记录入口</text>
          <text class="stealth-sheet-meta">2 项</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">类型</text>
          <text class="stealth-cell">说明</text>
          <text class="stealth-cell stealth-cell-action">操作</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell">内部日报</text>
          <text class="stealth-cell">查看今日公开记录</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap="openDailyList">查看</text>
          </view>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell">讨论记录</text>
          <text class="stealth-cell">浏览公开讨论和标记</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap="openForum">查看</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
@import "./stealth-table.css";
</style>
