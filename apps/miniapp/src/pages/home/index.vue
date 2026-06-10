<script setup lang="ts">
import { toggleVisualMode, useVisualModePage } from "../../services/visual-mode";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { onHide, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import {
  APP_SLOGAN,
  FEATURE_KEYS,
  FeaturePlacement,
  WorkProfileConfigStatus,
  WorkStatus,
  canNavigateFeatureEntry,
  calculateWorkValueState,
  DEFAULT_STATUTORY_HOLIDAY_CALENDAR,
  getFeatureEntryBlockedMessage,
  getNextStatutoryHoliday,
  HolidayDataStatus,
  HolidayQueryStatus,
  type DailyContentPublicSummary,
  type PublicFeatureEntry,
  type UserGrowthProfileSnapshot,
  type WorkProfileSnapshot,
  type WorkValueState
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import {
  resolveMiniappFirstRunState,
  type MiniappFirstRunState
} from "../../services/first-run-flow.ts";
import {
  clearLocalWorkProfileSnapshot,
  getLocalWorkProfileSnapshot,
  getWorkProfile,
  normalizeWorkProfileError,
  saveLocalWorkProfileSnapshot
} from "../../services/work-profile";
import { getSurvivalLedgerTodaySummary } from "../../services/accounting-ledger";
import { getDailyContentSummary } from "../../services/daily-content-feed";
import { getFeatureRegistryByPlacement } from "../../services/feature-registry";
import {
  SURVIVAL_AFTERNOON_CARD_IMAGE,
  SURVIVAL_CANTEEN_CARD_IMAGE,
  SURVIVAL_COMMUTE_CARD_IMAGE,
  SURVIVAL_LEDGER_BOARD_IMAGE
} from "../../services/static-covers";
import { resolveSemanticIconPath } from "../../visual-system/illustration-registry";

const { visualMode, visualModeClass, isHermitMode } = useVisualModePage();

const HOME_WORKPLACE_HERO_IMAGE = "/static/home/work-hero-workplace-20260609-r2.jpg";
const HOME_WORKPLACE_HERO_HIDDEN_IMAGE = "/static/home/work-hero-hidden-workplace-20260609-r2.jpg";
const HOME_HERMIT_HERO_IMAGE = "/static/home/work-hero-hermit-20260610-r2.jpg";
const HOME_HERMIT_HERO_HIDDEN_IMAGE = "/static/home/work-hero-hidden-hermit-20260610-r2.jpg";
const DAILY_CONTENT_VIEWED_ISSUE_STORAGE_KEY = "moyuxia.dailyContentViewedIssueId";

type CountdownCard = {
  label: string;
  valueText: string;
  unitText: string;
  desc: string;
  glowClass: string;
  fontClass: string;
  icon: string;
};

type TimedSupplyBubbleKind = "lunch" | "commute";

type TimedSupplyBubble = {
  kind: TimedSupplyBubbleKind;
  storageKey: string;
  text: string;
  actionText: string;
  sectionClass: string;
};

const bubbleQuotes = [
  "结印！影分身在开会，本体在守着进度条...",
  "老板正从 12 点钟方向逼近，结印隐身！",
  "只要我躺得足够平，老板的飞镖就射不中我。",
  "下午三点！兵粮丸补给时间到了！",
  "卷轴已展开，今日状态正在实时推演。",
  "运影秘术·带薪如厕！这一蹲就是半个时辰。",
  "当代隐者：表面疯狂敲键盘，实际电量在悄悄回血。"
];
const currentBubble = ref(bubbleQuotes[0]);
let bubbleTimer: ReturnType<typeof setInterval> | null = null;
let workValueTimer: ReturnType<typeof setInterval> | null = null;
let supplyBubbleDismissTimer: ReturnType<typeof setTimeout> | null = null;
let ambientBubbleDismissTimer: ReturnType<typeof setTimeout> | null = null;
const dismissedTimedSupplyBubbleKeys = new Set<string>();

const currentSnapshot = ref<WorkProfileSnapshot | null>(null);
const workValueState = ref<WorkValueState>(createUnconfiguredWorkValueState());
const loadingWorkProfile = ref(false);
const syncMessage = ref("");
const dailyContentSummary = ref<DailyContentPublicSummary | null>(null);
const dailyContentMessage = ref("隐者日报同步中");
const homeQuickEntries = ref<PublicFeatureEntry[]>([]);
const viewedDailyContentIssueId = ref(getViewedDailyContentIssueId());
const firstRunState = ref<MiniappFirstRunState>("logged_out");
const userProfileSnapshot = ref<UserGrowthProfileSnapshot | null>(null);
const firstRunProfileMessage = ref("");
const timedSupplyBubble = ref<TimedSupplyBubble | null>(null);
const supplyBubbleDismissing = ref(false);
const ambientBubbleVisible = ref(true);
const ambientBubbleDismissing = ref(false);

const isConfigured = computed(
  () =>
    firstRunState.value === "ready" &&
    workValueState.value.configStatus === WorkProfileConfigStatus.Configured
);
const isHiddenMode = ref(false);
const homeHeroImage = computed(() => {
  if (isHermitMode.value) {
    return isHiddenMode.value ? HOME_HERMIT_HERO_HIDDEN_IMAGE : HOME_HERMIT_HERO_IMAGE;
  }

  return isHiddenMode.value ? HOME_WORKPLACE_HERO_HIDDEN_IMAGE : HOME_WORKPLACE_HERO_IMAGE;
});
const toggleHiddenMode = () => {
  isHiddenMode.value = !isHiddenMode.value;
};
const amountText = computed(() =>
  !isConfigured.value
    ? "--"
    : isHiddenMode.value
      ? "••••"
      : workValueState.value.amountToday.toFixed(2)
);
const amountPrefix = computed(() => (isConfigured.value && !isHiddenMode.value ? "¥ " : ""));
const amountPerSecondText = computed(() => {
  if (!isConfigured.value || isHiddenMode.value) {
    return "";
  }

  return `每秒 +¥${workValueState.value.amountPerSecond.toFixed(4)}`;
});
const progressPercent = computed(() => Math.round(workValueState.value.workProgress * 100));
const workStatusView = computed(() => {
  switch (workValueState.value.status) {
    case WorkStatus.BeforeWork:
      return { label: "未上班", className: "status-idle" };
    case WorkStatus.Working:
      return { label: "工作中", className: "status-working" };
    case WorkStatus.OnBreak:
      return { label: "休息中", className: "status-break" };
    case WorkStatus.AfterWork:
      return { label: "已下班", className: "status-done" };
    case WorkStatus.RestDay:
      return { label: "休息日", className: "status-rest" };
    default:
      return { label: loadingWorkProfile.value ? "读取中" : "未配置", className: "status-idle" };
  }
});
const shouldFloatDailyEntryIcon = computed(
  () =>
    Boolean(dailyContentSummary.value) &&
    dailyContentSummary.value?.id !== viewedDailyContentIssueId.value
);
const shouldFloatSupplyEntryIcon = computed(
  () => Boolean(timedSupplyBubble.value) && !supplyBubbleDismissing.value
);
const stealthWorkbenchEntry = computed(
  () =>
    homeQuickEntries.value.find(
      (entry) => entry.featureKey === FEATURE_KEYS.stealthWorkbenchMode
    ) ?? null
);

const handleOpenAccountingLedger = () => {
  uni.navigateTo({ url: "/pages/accounting-ledger/index" });
};

const handleOpenSupplyCenter = () => {
  uni.navigateTo({ url: "/pages/supply-center/index" });
};

// 距下班倒计时（秒级，主展示）
const countdownToWorkEndText = computed(() => {
  if (!isConfigured.value) {
    return "--:--:--";
  }

  const seconds = workValueState.value.countdowns.secondsUntilWorkEnd;

  if (seconds === undefined || seconds <= 0) {
    return workValueState.value.status === WorkStatus.AfterWork ? "已收工" : "--:--:--";
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

// 今日生存消耗三类金额
type SurvivalCategory = { label: string; amount: string; artwork: string };
const survivalCategories = ref<SurvivalCategory[]>(createSurvivalCategories());

onMounted(() => {
  bubbleTimer = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * bubbleQuotes.length);
    currentBubble.value = bubbleQuotes[randomIndex];
  }, 6000);

  void refreshDailyContentSummary();
});

onUnmounted(() => {
  stopWorkValueTimer();
  if (bubbleTimer) {
    clearInterval(bubbleTimer);
  }
  if (supplyBubbleDismissTimer) {
    clearTimeout(supplyBubbleDismissTimer);
  }
  if (ambientBubbleDismissTimer) {
    clearTimeout(ambientBubbleDismissTimer);
  }
});

onShow(() => {
  resetHomeBubblesForVisit();
  void refreshHomePageData();
});

onHide(() => {
  stopWorkValueTimer();
});

onPullDownRefresh(() => {
  void refreshHomePageData().finally(() => {
    uni.stopPullDownRefresh();
  });
});

async function refreshHomePageData(): Promise<void> {
  await Promise.all([
    refreshHomeFirstRunState(),
    refreshAccountingSummary(),
    refreshDailyContentSummary(),
    refreshHomeQuickEntries()
  ]);
}

const handleOpenWorkProfileSettings = () => {
  if (firstRunState.value === "logged_out" || firstRunState.value === "profile_missing") {
    uni.switchTab({ url: "/pages/profile/index" });
    return;
  }

  uni.navigateTo({ url: "/pages/work-profile/settings" });
};

const handleOpenDailyContent = () => {
  markCurrentDailyContentIssueViewed();
  uni.navigateTo({ url: "/pages/daily-content/index" });
};

const handleHomeFeatureEntryTap = (entry: PublicFeatureEntry) => {
  if (!canNavigateFeatureEntry(entry) || !entry.publicRoute) {
    uni.showToast({ title: getFeatureEntryBlockedMessage(entry), icon: "none" });
    return;
  }

  uni.navigateTo({ url: entry.publicRoute });
};

const handleOpenStealthWorkbench = () => {
  if (!stealthWorkbenchEntry.value) {
    return;
  }

  handleHomeFeatureEntryTap(stealthWorkbenchEntry.value);
};

async function refreshHomeQuickEntries(): Promise<void> {
  const response = await getFeatureRegistryByPlacement(FeaturePlacement.HomeQuickEntry);
  homeQuickEntries.value = response.entries.filter(
    (entry) => entry.featureKey === FEATURE_KEYS.stealthWorkbenchMode
  );
}

const countdownCards = computed<CountdownCard[]>(() => {
  const countdowns = workValueState.value.countdowns;
  const holidayCountdown = getNextStatutoryHoliday({
    calendar: DEFAULT_STATUTORY_HOLIDAY_CALENDAR,
    now: new Date()
  });
  const holidayCard = formatHolidayCountdown(holidayCountdown);

  return [
    {
      label: "距休息日",
      ...formatCountdown(countdowns.secondsUntilRestDay, "待配置"),
      desc: isConfigured.value ? "按工作日规则推导" : "填写工作日后显示",
      glowClass: "vs-glow-green",
      fontClass: "font-green",
      icon: "px-icon-rest"
    },
    {
      label: "距发薪日",
      ...formatCountdown(countdowns.secondsUntilPayday, "待配置"),
      desc: isConfigured.value ? "按发薪日规则推导" : "填写发薪日后显示",
      glowClass: "vs-glow-yellow",
      fontClass: "font-yellow",
      icon: "px-icon-salary"
    },
    {
      label: holidayCard.label,
      valueText: holidayCard.valueText,
      unitText: holidayCard.unitText,
      desc: holidayCard.desc,
      glowClass: "vs-glow-rare",
      fontClass: holidayCard.fontClass,
      icon: "px-icon-calendar"
    }
  ];
});

async function refreshWorkProfileForHome(): Promise<void> {
  if (!getAppAuthToken() || firstRunState.value === "profile_missing") {
    currentSnapshot.value = null;
    workValueState.value = createUnconfiguredWorkValueState();
    stopWorkValueTimer();
    syncMessage.value = "";
    return;
  }

  const localSnapshot = getLocalWorkProfileSnapshot();
  currentSnapshot.value = localSnapshot;
  recalculateWorkValue();

  if (localSnapshot) {
    startWorkValueTimer();
  }

  loadingWorkProfile.value = true;
  syncMessage.value = "";

  try {
    const response = await getWorkProfile();

    if (response.snapshot) {
      currentSnapshot.value = response.snapshot;
      saveLocalWorkProfileSnapshot(response.snapshot);
      syncMessage.value = "";
    } else {
      currentSnapshot.value = null;
      clearLocalWorkProfileSnapshot();
      syncMessage.value = "";
    }

    recalculateWorkValue();

    if (currentSnapshot.value) {
      startWorkValueTimer();
    } else {
      stopWorkValueTimer();
    }
  } catch (error) {
    const message = normalizeWorkProfileError(error).message;
    syncMessage.value = localSnapshot ? `同步失败，已使用本地快照：${message}` : message;

    if (localSnapshot) {
      startWorkValueTimer();
    } else {
      stopWorkValueTimer();
    }
  } finally {
    loadingWorkProfile.value = false;
  }
}

async function refreshHomeFirstRunState(): Promise<void> {
  const result = await resolveMiniappFirstRunState();
  firstRunState.value = result.state;
  userProfileSnapshot.value = result.profileSnapshot;
  firstRunProfileMessage.value = result.profileSyncMessage;
  syncMessage.value = result.workProfileSyncMessage;
  await refreshWorkProfileForHome();
}

function recalculateWorkValue(): void {
  try {
    workValueState.value = calculateWorkValueState({
      snapshot: currentSnapshot.value,
      now: new Date()
    });
    updateTimedSupplyBubble();
  } catch (error) {
    console.error("moyuxia home work value error", error);
    currentSnapshot.value = null;
    workValueState.value = createUnconfiguredWorkValueState();
    timedSupplyBubble.value = null;
    syncMessage.value = "本地档案异常，请重新填写薪资和时间。";
  }
}

function createUnconfiguredWorkValueState(): WorkValueState {
  return calculateWorkValueState({ snapshot: null, now: new Date() });
}

function startWorkValueTimer(): void {
  stopWorkValueTimer();
  workValueTimer = setInterval(recalculateWorkValue, 1000);
}

function stopWorkValueTimer(): void {
  if (workValueTimer) {
    clearInterval(workValueTimer);
    workValueTimer = null;
  }
}

function getViewedDailyContentIssueId(): string {
  try {
    const value = uni.getStorageSync(DAILY_CONTENT_VIEWED_ISSUE_STORAGE_KEY);
    return typeof value === "string" ? value : "";
  } catch (error) {
    console.warn("moyuxia daily content viewed issue read failed", error);
    return "";
  }
}

function markCurrentDailyContentIssueViewed(): void {
  if (!dailyContentSummary.value) {
    return;
  }

  viewedDailyContentIssueId.value = dailyContentSummary.value.id;

  try {
    uni.setStorageSync(DAILY_CONTENT_VIEWED_ISSUE_STORAGE_KEY, dailyContentSummary.value.id);
  } catch (error) {
    console.warn("moyuxia daily content viewed issue save failed", error);
  }
}

function resetHomeBubblesForVisit(): void {
  ambientBubbleVisible.value = true;
  ambientBubbleDismissing.value = false;
  dismissedTimedSupplyBubbleKeys.clear();
  supplyBubbleDismissing.value = false;

  if (ambientBubbleDismissTimer) {
    clearTimeout(ambientBubbleDismissTimer);
    ambientBubbleDismissTimer = null;
  }

  if (supplyBubbleDismissTimer) {
    clearTimeout(supplyBubbleDismissTimer);
    supplyBubbleDismissTimer = null;
  }
}

function updateTimedSupplyBubble(): void {
  const nextBubble = resolveTimedSupplyBubble(currentSnapshot.value, new Date());
  if (!nextBubble) {
    timedSupplyBubble.value = null;
    supplyBubbleDismissing.value = false;
    return;
  }

  if (isTimedSupplyBubbleDismissed(nextBubble.storageKey)) {
    timedSupplyBubble.value = null;
    supplyBubbleDismissing.value = false;
    return;
  }

  if (timedSupplyBubble.value?.storageKey !== nextBubble.storageKey) {
    supplyBubbleDismissing.value = false;
  }

  timedSupplyBubble.value = nextBubble;
}

function dismissTimedSupplyBubble(): void {
  if (!timedSupplyBubble.value || supplyBubbleDismissing.value) {
    return;
  }

  const storageKey = timedSupplyBubble.value.storageKey;
  markTimedSupplyBubbleDismissed(storageKey);
  supplyBubbleDismissing.value = true;

  if (supplyBubbleDismissTimer) {
    clearTimeout(supplyBubbleDismissTimer);
  }

  supplyBubbleDismissTimer = setTimeout(() => {
    if (timedSupplyBubble.value?.storageKey === storageKey) {
      timedSupplyBubble.value = null;
    }
    supplyBubbleDismissing.value = false;
  }, 360);
}

function dismissAmbientBubble(): void {
  if (!ambientBubbleVisible.value || ambientBubbleDismissing.value) {
    return;
  }

  ambientBubbleDismissing.value = true;

  if (ambientBubbleDismissTimer) {
    clearTimeout(ambientBubbleDismissTimer);
  }

  ambientBubbleDismissTimer = setTimeout(() => {
    ambientBubbleVisible.value = false;
    ambientBubbleDismissing.value = false;
  }, 360);
}

function resolveTimedSupplyBubble(
  snapshot: WorkProfileSnapshot | null,
  now: Date
): TimedSupplyBubble | null {
  if (!snapshot || snapshot.configStatus !== WorkProfileConfigStatus.Configured) {
    return null;
  }

  const firstBreak = snapshot.workTime.breaks[0];
  const dateKey = formatDateKey(now);

  if (firstBreak) {
    const lunchStart = dateAtTime(now, firstBreak.startTime);
    const lunchEnd = dateAtTime(now, firstBreak.endTime);
    const lunchPromptStart = new Date(lunchStart.getTime() - 10 * 60 * 1000);

    if (now >= lunchPromptStart && now < lunchEnd) {
      return {
        kind: "lunch",
        storageKey: `moyuxia.timedSupplyBubble.${dateKey}.lunch.${firstBreak.startTime}`,
        text: "午休封印即将解除，先把饭票备好，别让胃在工位上发动叛乱。",
        actionText: "去买吃的",
        sectionClass: "supply-lunch"
      };
    }
  }

  const workEnd = dateAtTime(now, snapshot.workTime.endTime);
  const commutePromptStart = new Date(workEnd.getTime() - 10 * 60 * 1000);
  const commutePromptEnd = new Date(workEnd.getTime() + 60 * 60 * 1000);

  if (now >= commutePromptStart && now < commutePromptEnd) {
    return {
      kind: "commute",
      storageKey: `moyuxia.timedSupplyBubble.${dateKey}.commute.${snapshot.workTime.endTime}`,
      text: "收工遁术倒计时，打车卷轴可以先备上，别在楼下和晚高峰硬碰硬。",
      actionText: "去打车",
      sectionClass: "supply-commute"
    };
  }

  return null;
}

function isTimedSupplyBubbleDismissed(storageKey: string): boolean {
  return dismissedTimedSupplyBubbleKeys.has(storageKey);
}

function markTimedSupplyBubbleDismissed(storageKey: string): void {
  dismissedTimedSupplyBubbleKeys.add(storageKey);
}

function dateAtTime(base: Date, time: string): Date {
  const [hourText, minuteText] = time.split(":");
  const next = new Date(base);
  next.setHours(Number(hourText), Number(minuteText), 0, 0);
  return next;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatCountdown(
  seconds: number | undefined,
  fallback: string
): Pick<CountdownCard, "valueText" | "unitText"> {
  if (seconds === undefined) {
    return { valueText: fallback, unitText: "" };
  }

  if (seconds <= 0) {
    return { valueText: "现在", unitText: "" };
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return { valueText: String(days), unitText: "天" };
  }

  if (hours > 0) {
    return { valueText: String(hours), unitText: "小时" };
  }

  return { valueText: String(Math.max(1, minutes)), unitText: "分钟" };
}

function formatHolidayCountdown(
  result: ReturnType<typeof getNextStatutoryHoliday>
): Pick<CountdownCard, "label" | "valueText" | "unitText" | "desc" | "fontClass"> {
  if (result.status === HolidayQueryStatus.NoAvailableData) {
    return {
      label: "法定节假日",
      valueText: formatHolidayUnavailable(result.reason),
      unitText: "",
      desc: "权威日历未就绪",
      fontClass: "font-muted"
    };
  }

  if (result.status === HolidayQueryStatus.Ongoing) {
    return {
      label: `距${result.holiday.name}`,
      valueText: "进行中",
      unitText: "",
      desc: "来自已核验静态日历",
      fontClass: "font-yellow"
    };
  }

  return {
    label: `距${result.holiday.name}`,
    valueText: String(result.daysUntilStart),
    unitText: "天",
    desc: result.dataStatus === HolidayDataStatus.Verified ? "距下一个法定节假日" : "待权威核验",
    fontClass: result.dataStatus === HolidayDataStatus.Verified ? "font-yellow" : "font-muted"
  };
}

function formatHolidayUnavailable(reason: string): string {
  if (reason === HolidayDataStatus.PendingPublication) {
    return "待发布";
  }

  if (reason === HolidayDataStatus.PendingSync || reason === HolidayDataStatus.SyncFailed) {
    return "待同步";
  }

  return "待核验";
}

const settingBannerText = computed(() =>
  firstRunState.value === "logged_out"
    ? "先登录 >> 开启隐者身份"
    : firstRunState.value === "profile_missing"
      ? "先建档 >> 创建隐者档案"
      : isConfigured.value
        ? "设置 >> 调整薪资和时间"
        : "设置 >> 去填写薪资和时间"
);
const heroCardClasses = computed(() => [
  "vs-panel",
  "vs-pixel-frame-primary",
  "hero-card",
  isHermitMode.value ? "hero-card-hidden" : "hero-card-office"
]);
const visualModeSwitchText = computed(() =>
  visualMode.value === "workplace" ? "隐者模式" : "返回工位"
);

function handleToggleVisualMode(): void {
  const nextMode = toggleVisualMode();
  uni.showToast({
    title: nextMode === "hermit" ? "已进入隐者模式" : "已返回工位模式",
    icon: "none"
  });
}

const headerIdentity = computed(() => {
  if (firstRunState.value === "logged_out") {
    return {
      title: "未入隐者大陆",
      badge: "待登录"
    };
  }

  if (firstRunState.value === "profile_missing" || !userProfileSnapshot.value) {
    return {
      title: "隐者档案未创建",
      badge: "待建档"
    };
  }

  return {
    title: userProfileSnapshot.value.displayName,
    badge: `${userProfileSnapshot.value.factionLabel} · LV.${userProfileSnapshot.value.level}`
  };
});

const heroEmptyGuideText = computed(() => {
  if (firstRunState.value === "logged_out") {
    return "先登录并创建隐者档案";
  }

  if (firstRunState.value === "profile_missing") {
    return "先创建隐者档案";
  }

  return "填写薪资和上班时间，开始本地实时估算";
});

async function refreshAccountingSummary(): Promise<void> {
  try {
    const summary = await getSurvivalLedgerTodaySummary(todayBusinessDate());
    const categoryMap = new Map(summary.categories.map((c) => [c.categoryKey, c.amountMinor]));
    survivalCategories.value = createSurvivalCategories(categoryMap);
    // totalAmountMinor / 100 = 今日总生存消耗（元）
  } catch {
    // 生存账本暂不可用时展示默认值
    survivalCategories.value = createSurvivalCategories();
  }
}

async function refreshDailyContentSummary(): Promise<void> {
  try {
    const response = await getDailyContentSummary();
    dailyContentSummary.value = response.issue;
    dailyContentMessage.value = response.issue ? "" : "今日日报尚未发布，稍后再看。";
  } catch (error) {
    dailyContentSummary.value = null;
    dailyContentMessage.value = error instanceof Error ? error.message : "隐者日报暂不可用";
  }
}

function todayBusinessDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function createSurvivalCategories(categoryMap = new Map<string, number>()): SurvivalCategory[] {
  return [
    {
      label: "隐者食堂",
      amount: `¥${((categoryMap.get("canteen") ?? 0) / 100).toFixed(2)}`,
      artwork: SURVIVAL_CANTEEN_CARD_IMAGE
    },
    {
      label: "下午续命",
      amount: `¥${((categoryMap.get("afternoon_boost") ?? 0) / 100).toFixed(2)}`,
      artwork: SURVIVAL_AFTERNOON_CARD_IMAGE
    },
    {
      label: "通勤",
      amount: `¥${((categoryMap.get("commute") ?? 0) / 100).toFixed(2)}`,
      artwork: SURVIVAL_COMMUTE_CARD_IMAGE
    }
  ];
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <!-- 顶部身份信息与 Slogan -->
    <view class="vs-row-between header">
      <view class="header-left">
        <text class="slogan">✦ {{ APP_SLOGAN }} ✦</text>
        <text class="vs-title main-title">{{ headerIdentity.title }}</text>
        <text class="identity-badge-inline">{{ headerIdentity.badge }}</text>
      </view>
      <button class="mode-switch-btn" @tap="handleToggleVisualMode">
        {{ visualModeSwitchText }}
      </button>
    </view>
    <text v-if="firstRunProfileMessage" class="sync-message">{{ firstRunProfileMessage }}</text>

    <!-- 今日已摸钱主卡 -->
    <view :class="heroCardClasses">
      <view class="hero-frame hero-frame-top" aria-hidden="true" />
      <view class="hero-frame hero-frame-right" aria-hidden="true" />
      <view class="hero-frame hero-frame-bottom" aria-hidden="true" />
      <view class="hero-frame hero-frame-left" aria-hidden="true" />
      <view class="hero-frame-corner corner-tl" aria-hidden="true" />
      <view class="hero-frame-corner corner-tr" aria-hidden="true" />
      <view class="hero-frame-corner corner-br" aria-hidden="true" />
      <view class="hero-frame-corner corner-bl" aria-hidden="true" />
      <!-- 左侧信息 -->
      <view class="hero-copy">
        <view class="vs-row card-title-row">
          <text class="card-title">今日已摸到的钱</text>
          <text :class="['status-pill', workStatusView.className]">{{ workStatusView.label }}</text>
        </view>
        <view class="vs-row amount-row">
          <text :class="['amount-num', isHiddenMode ? 'amount-masked' : '']">
            {{ amountPrefix }}{{ amountText }}
          </text>
          <view class="eye-toggle" @tap.stop="toggleHiddenMode">
            <text class="eye-icon">{{ isHiddenMode ? "👁️‍🗨️" : "👁️" }}</text>
          </view>
        </view>
        <text v-if="amountPerSecondText" class="flow-text">{{ amountPerSecondText }}</text>
        <view class="countdown-primary-row">
          <text class="countdown-primary-label">距下班</text>
          <text class="countdown-primary-value vs-font-pixel">{{ countdownToWorkEndText }}</text>
        </view>
        <view v-if="isConfigured" class="progress-track">
          <view class="progress-fill" :style="{ width: `${progressPercent}%` }" />
        </view>
        <view v-else class="empty-guide" @tap="handleOpenWorkProfileSettings">
          <text>{{ heroEmptyGuideText }}</text>
        </view>
        <text v-if="syncMessage" class="sync-message">{{ syncMessage }}</text>
        <!-- 设置按钮内嵌在主卡底部 -->
        <view class="hero-settings-btn" @tap="handleOpenWorkProfileSettings">
          <image
            class="hero-settings-icon"
            :src="resolveSemanticIconPath('px-icon-menu-work-settings')"
            mode="aspectFit"
          />
          <text class="hero-settings-text">{{ settingBannerText }}</text>
        </view>
      </view>

      <!-- 右侧：像素角色插画 -->
      <view class="scene-container">
        <view
          v-if="timedSupplyBubble"
          :class="[
            'vs-bubble',
            'home-bubble',
            'timed-supply-bubble',
            timedSupplyBubble.sectionClass,
            supplyBubbleDismissing ? 'supply-bubble-dismissing' : ''
          ]"
          @tap="dismissTimedSupplyBubble"
        >
          <text>{{ timedSupplyBubble.text }}</text>
          <button class="bubble-action" @tap.stop="handleOpenSupplyCenter">
            {{ timedSupplyBubble.actionText }}
          </button>
          <view v-if="supplyBubbleDismissing" class="smoke-burst" aria-hidden="true">
            <view class="smoke-puff smoke-puff-1" />
            <view class="smoke-puff smoke-puff-2" />
            <view class="smoke-puff smoke-puff-3" />
            <view class="smoke-puff smoke-puff-4" />
            <view class="smoke-puff smoke-puff-5" />
          </view>
        </view>
        <view
          v-else-if="ambientBubbleVisible || ambientBubbleDismissing"
          :class="[
            'vs-bubble',
            'home-bubble',
            ambientBubbleDismissing ? 'supply-bubble-dismissing' : ''
          ]"
          @tap="dismissAmbientBubble"
        >
          <text>{{ currentBubble }}</text>
          <view v-if="ambientBubbleDismissing" class="smoke-burst" aria-hidden="true">
            <view class="smoke-puff smoke-puff-1" />
            <view class="smoke-puff smoke-puff-2" />
            <view class="smoke-puff smoke-puff-3" />
            <view class="smoke-puff smoke-puff-4" />
            <view class="smoke-puff smoke-puff-5" />
          </view>
        </view>
      </view>
      <view :class="['hero-asset-mask', isHermitMode ? 'hero-asset-hidden' : '']">
        <image class="hero-asset-image" :src="homeHeroImage" mode="aspectFill" />
      </view>
      <button
        v-if="stealthWorkbenchEntry"
        class="hero-stealth-entry-btn"
        @tap.stop="handleOpenStealthWorkbench"
      >
        进入摸鱼模式
      </button>
    </view>

    <!-- 两个核心入口卡：日报 + 补给铺 -->
    <view class="entry-row">
      <view
        class="entry-card entry-card-daily vs-panel vs-card-raised vs-card-pressable"
        @tap="handleOpenDailyContent"
      >
        <view class="entry-card-texture" />
        <view :class="['entry-card-top', shouldFloatDailyEntryIcon ? 'entry-icon-floating' : '']">
          <view class="entry-icon entry-icon-token">
            <image
              class="entry-icon-image"
              :src="resolveSemanticIconPath('px-banner-home-daily')"
              mode="aspectFit"
            />
          </view>
          <text v-if="shouldFloatDailyEntryIcon" class="entry-badge entry-badge-new">NEW</text>
        </view>
        <text class="entry-title">隐者日报</text>
        <view class="entry-desc">
          <text class="entry-desc-line">每日新闻、热梗、信息差</text>
          <text class="entry-desc-line">摸鱼必备知识站</text>
        </view>
        <text class="entry-action">去看看 ›</text>
      </view>
      <view
        class="entry-card entry-card-supply vs-panel vs-card-raised vs-card-pressable"
        @tap="handleOpenSupplyCenter"
      >
        <view class="entry-card-texture" />
        <view :class="['entry-card-top', shouldFloatSupplyEntryIcon ? 'entry-icon-floating' : '']">
          <view class="entry-icon entry-icon-token">
            <image
              class="entry-icon-image"
              :src="resolveSemanticIconPath('px-banner-home-supply')"
              mode="aspectFit"
            />
          </view>
        </view>
        <text class="entry-title">隐者餐厅</text>
        <view class="entry-desc">
          <text class="entry-desc-line">领券点外卖，咖啡续命</text>
          <text class="entry-desc-line">通勤补给一键备好</text>
        </view>
        <text class="entry-action">去干饭 ›</text>
      </view>
    </view>

    <!-- 倒计时卡组 -->
    <view class="vs-grid-3 countdown-grid">
      <view
        v-for="card in countdownCards"
        :key="card.label"
        :class="['countdown vs-panel vs-card-raised', card.glowClass]"
      >
        <view class="countdown-heading">
          <image
            class="countdown-icon"
            :src="resolveSemanticIconPath(card.icon)"
            mode="aspectFit"
          />
          <text class="countdown-label">{{ card.label }}</text>
        </view>
        <view class="countdown-value-row">
          <text :class="['countdown-value', card.fontClass]">{{ card.valueText }}</text>
          <text v-if="card.unitText" class="unit-text">{{ card.unitText }}</text>
        </view>
        <text class="countdown-desc">{{ card.desc }}</text>
      </view>
    </view>

    <!-- 今日生存消耗大卡 -->
    <view
      class="survival-card vs-panel vs-card-raised vs-card-pressable"
      @click="handleOpenAccountingLedger"
    >
      <image class="survival-card-bg" :src="SURVIVAL_LEDGER_BOARD_IMAGE" mode="aspectFill" />
      <view class="survival-card-shade" />
      <view class="survival-card-content">
        <view class="vs-row-between survival-card-header">
          <text class="survival-card-title">今日生存消耗</text>
          <text class="survival-detail-link">查看详情 ›</text>
        </view>
        <view class="vs-grid-3 survival-amounts">
          <view v-for="cat in survivalCategories" :key="cat.label" class="survival-amount-item">
            <image class="survival-amount-bg" :src="cat.artwork" mode="aspectFill" />
            <view class="survival-amount-content">
              <text class="survival-cat-label">{{ cat.label }}</text>
              <text :class="['survival-cat-amount', isHiddenMode ? 'amount-masked-sm' : '']">
                {{ isHiddenMode ? "••••" : cat.amount }}
              </text>
            </view>
          </view>
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

.header {
  padding-bottom: 0;
}
.header-left {
  display: flex;
  flex-direction: column;
}

.slogan {
  font-size: 20rpx;
  color: var(--camp-gold);
  letter-spacing: 2rpx;
  font-weight: 700;
}

.main-title {
  margin-top: 2rpx;
  font-size: 40rpx;
  color: var(--camp-text-strong);
  font-weight: 900;
}

.identity-badge-inline {
  align-self: flex-start;
  margin-top: 6rpx;
  padding: 4rpx 12rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 6rpx;
  color: var(--camp-primary);
  background: rgba(47, 111, 115, 0.08);
  font-weight: 700;
  font-size: 19rpx;
  line-height: 1.3;
}

.mode-switch-btn {
  flex-shrink: 0;
  min-width: 144rpx;
  max-width: 178rpx;
  min-height: 58rpx;
  padding: 0 18rpx;
  border-width: 2rpx !important;
  border-color: var(--vs-button-border) !important;
  border-radius: 999rpx !important;
  background: var(--camp-card);
  color: var(--camp-gold);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 58rpx;
  box-shadow:
    var(--camp-inset-highlight),
    var(--camp-inset-lowlight),
    0 4rpx 10rpx rgba(17, 24, 39, 0.14) !important;
  text-shadow: none;
}

.mode-switch-btn::after {
  border: 0;
}

.mode-switch-btn:active {
  transform: translateY(2rpx) !important;
  box-shadow:
    var(--camp-inset-highlight),
    var(--camp-inset-lowlight),
    0 2rpx 6rpx rgba(17, 24, 39, 0.12) !important;
}

/* 主金额卡 */
.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  position: relative;
  isolation: isolate;
  min-height: 280rpx;
  border: 3rpx solid #6f4a35 !important;
  border-radius: 18rpx !important;
  background:
    linear-gradient(
      90deg,
      var(--camp-asset-shade-strong) 0%,
      var(--camp-asset-shade-medium) 56%,
      var(--camp-asset-shade-soft) 100%
    ),
    var(--camp-card) !important;
  box-shadow:
    0 0 0 2rpx #241713,
    0 0 0 4rpx rgba(207, 146, 82, 0.28),
    inset 0 0 0 3rpx #211729,
    inset 0 0 0 6rpx rgba(255, 219, 146, 0.06),
    inset 0 -7rpx 0 rgba(0, 0, 0, 0.2),
    0 7rpx 0 rgba(0, 0, 0, 0.32),
    0 0 18rpx rgba(154, 106, 22, 0.08) !important;
}

.hero-card-office {
  min-height: 340rpx;
  height: 340rpx;
  box-sizing: border-box;
  border-width: 3rpx !important;
  border-color: rgba(185, 154, 100, 0.62) !important;
  background:
    linear-gradient(90deg, rgba(255, 253, 248, 0.98) 0%, rgba(255, 250, 241, 0.84) 100%),
    var(--camp-card) !important;
  box-shadow:
    0 0 0 2rpx rgba(255, 253, 248, 0.94),
    0 0 0 4rpx rgba(185, 154, 100, 0.18),
    var(--camp-inset-highlight),
    var(--camp-inset-lowlight),
    0 16rpx 28rpx rgba(17, 24, 39, 0.18) !important;
}

.hero-card-hidden {
  min-height: 340rpx;
  height: 340rpx;
  box-sizing: border-box;
  background:
    linear-gradient(90deg, var(--camp-asset-shade-strong) 0%, var(--camp-asset-shade-medium) 100%),
    var(--camp-card) !important;
  border-color: #5f4b57 !important;
  box-shadow:
    0 0 0 3rpx #19151b,
    0 0 0 5rpx rgba(236, 178, 255, 0.16),
    inset 0 0 0 3rpx #201a2b,
    inset 0 0 0 6rpx rgba(236, 178, 255, 0.05),
    inset 0 -8rpx 0 rgba(0, 0, 0, 0.24),
    0 8rpx 0 rgba(0, 0, 0, 0.34) !important;
}

.hero-frame,
.hero-frame-corner {
  position: absolute;
  z-index: 6;
  pointer-events: none;
}

.hero-frame {
  background: linear-gradient(180deg, #9a6a16 0%, #9a6a16 58%, #111827 100%);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 229, 174, 0.42),
    inset -1rpx -1rpx 0 rgba(42, 23, 14, 0.72);
}

.hero-frame-top {
  top: -1rpx;
  left: 36rpx;
  right: 36rpx;
  height: 7rpx;
}

.hero-frame-bottom {
  left: 36rpx;
  right: 36rpx;
  bottom: -1rpx;
  height: 7rpx;
  transform: rotate(180deg);
}

.hero-frame-left {
  top: 36rpx;
  bottom: 36rpx;
  left: -1rpx;
  width: 7rpx;
}

.hero-frame-right {
  top: 36rpx;
  right: -1rpx;
  bottom: 36rpx;
  width: 7rpx;
  transform: rotate(180deg);
}

.hero-frame-corner {
  width: 8rpx;
  height: 8rpx;
  background: transparent;
  box-shadow:
    16rpx 0 0 #9a6a16,
    24rpx 0 0 #9f6b43,
    8rpx 8rpx 0 #9a6a16,
    16rpx 8rpx 0 #a66f45,
    24rpx 8rpx 0 #563724,
    0 16rpx 0 #9a6a16,
    8rpx 16rpx 0 #9f6b43,
    16rpx 16rpx 0 #563724,
    24rpx 16rpx 0 #241713,
    0 24rpx 0 #9f6b43,
    8rpx 24rpx 0 #563724,
    16rpx 24rpx 0 #241713;
  filter: drop-shadow(1rpx 1rpx 0 rgba(0, 0, 0, 0.38));
}

.corner-tl {
  top: -6rpx;
  left: -6rpx;
}

.corner-tr {
  top: -6rpx;
  right: -6rpx;
  transform: rotate(90deg);
}

.corner-br {
  right: -6rpx;
  bottom: -6rpx;
  transform: rotate(180deg);
}

.corner-bl {
  bottom: -6rpx;
  left: -6rpx;
  transform: rotate(270deg);
}

.hero-card-hidden .hero-frame {
  background: linear-gradient(180deg, #5d3b78 0%, #3a244e 58%, #1f1729 100%);
  opacity: 0.86;
}

.hero-card-office .hero-frame {
  background: linear-gradient(180deg, #9a6a16 0%, #9a6a16 58%, #9a6a16 100%);
  opacity: 0.92;
}

.hero-card-hidden .hero-frame-top,
.hero-card-hidden .hero-frame-bottom,
.hero-card-office .hero-frame-top,
.hero-card-office .hero-frame-bottom {
  height: 9rpx;
}

.hero-card-hidden .hero-frame-left,
.hero-card-hidden .hero-frame-right,
.hero-card-office .hero-frame-left,
.hero-card-office .hero-frame-right {
  width: 9rpx;
}

.hero-card-hidden .hero-frame-corner {
  background: transparent;
  box-shadow:
    16rpx 0 0 #5d3b78,
    24rpx 0 0 #422b59,
    8rpx 8rpx 0 #5d3b78,
    16rpx 8rpx 0 #4c3266,
    24rpx 8rpx 0 #2b2038,
    0 16rpx 0 #5d3b78,
    8rpx 16rpx 0 #422b59,
    16rpx 16rpx 0 #2b2038,
    24rpx 16rpx 0 #17111f,
    0 24rpx 0 #422b59,
    8rpx 24rpx 0 #2b2038,
    16rpx 24rpx 0 #17111f;
}

.hero-card-office .hero-frame-corner {
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

.hero-copy {
  display: flex;
  flex: 1.2;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.card-title-row {
  gap: 8rpx;
  align-items: center;
}

.card-title {
  color: var(--camp-text-soft);
  font-size: 22rpx;
}

.hero-card-office .card-title,
.hero-card-office .countdown-primary-label,
.hero-card-office .flow-text,
.hero-card-office .sync-message {
  color: rgba(63, 52, 40, 0.82);
  text-shadow: none;
}

.hero-card-hidden .card-title,
.hero-card-hidden .countdown-primary-label,
.hero-card-hidden .flow-text,
.hero-card-hidden .sync-message {
  color: rgba(228, 225, 237, 0.72);
}

.status-pill {
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  padding: 3rpx 10rpx;
  font-size: 18rpx;
  font-weight: 700;
}

.status-idle {
  color: var(--camp-text-soft);
  background: rgba(157, 139, 160, 0.1);
}
.status-working {
  color: var(--camp-cyan);
  background: rgba(0, 219, 233, 0.1);
}
.status-break {
  color: var(--camp-gold);
  background: rgba(154, 106, 22, 0.1);
}
.status-done,
.status-rest {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.hero-card-office .status-pill {
  border-color: rgba(154, 106, 22, 0.32);
  color: #5f4a2f;
  background: rgba(255, 250, 241, 0.82);
  text-shadow: none;
}

.hero-card-office .status-working {
  color: #23777b;
  background: rgba(35, 119, 123, 0.1);
}

.hero-card-office .status-break {
  color: #8a5e12;
  background: rgba(154, 106, 22, 0.11);
}

.hero-card-office .status-done,
.hero-card-office .status-rest {
  color: #218357;
  background: rgba(33, 131, 87, 0.1);
}

.amount-row {
  align-items: center;
  gap: 12rpx;
}

.amount-num {
  color: var(--camp-gold);
  font-size: 56rpx;
  font-weight: 900;
  line-height: 1.1;
  font-family: var(--vs-font-display);
  word-break: break-all;
}

.hero-card-office .amount-num {
  color: #9a6a16;
  text-shadow: none;
}

.amount-masked {
  color: var(--camp-text-soft);
  letter-spacing: 4rpx;
}

.eye-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.hero-card-office .eye-toggle {
  background: rgba(255, 250, 241, 0.78);
  box-shadow:
    inset 0 -3rpx 0 rgba(154, 106, 22, 0.1),
    0 0 0 1rpx rgba(154, 106, 22, 0.2);
}

.eye-icon {
  font-size: 28rpx;
}

.countdown-primary-row {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 4rpx;
}

.countdown-primary-label {
  font-size: 20rpx;
  color: var(--camp-text-soft);
}

.countdown-primary-value {
  font-size: 32rpx;
  font-weight: 900;
  color: var(--camp-cyan);
  font-family: var(--vs-font-display);
}

.hero-card-office .countdown-primary-value {
  color: #23777b;
  text-shadow: none;
}

.flow-text {
  font-size: 20rpx;
  color: var(--camp-text-soft);
}

.progress-track {
  width: 100%;
  height: 8rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
}

.hero-card-office .progress-track {
  background: rgba(154, 106, 22, 0.14);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--camp-cyan) 0%, var(--camp-gold) 100%);
}

.sync-message,
.empty-guide {
  font-size: 18rpx;
  color: var(--camp-text-soft);
}

.empty-guide {
  display: inline-flex;
  max-width: 100%;
  border: 1rpx solid rgba(154, 106, 22, 0.3);
  border-radius: 8rpx;
  padding: 8rpx 12rpx;
  color: var(--camp-gold);
  background: rgba(154, 106, 22, 0.06);
  box-sizing: border-box;
}

.hero-card-office .empty-guide {
  border-color: rgba(154, 106, 22, 0.34);
  color: #7a5519;
  background: rgba(255, 250, 241, 0.82);
  text-shadow: none;
}

/* 右侧场景容器 */
.scene-container {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  align-items: stretch;
  justify-content: stretch;
  position: relative;
  flex: 0.92;
  min-height: 252rpx;
  overflow: visible;
  z-index: 8;
}

.home-bubble {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: -18rpx;
  width: 240rpx;
  z-index: 20;
  box-sizing: border-box;
}

.timed-supply-bubble {
  display: flex;
  width: 300rpx;
  min-height: 138rpx;
  flex-direction: column;
  gap: 10rpx;
  padding: 18rpx 20rpx 18rpx 18rpx !important;
  border-color: rgba(154, 106, 22, 0.52) !important;
  background: #fff7df !important;
  color: #1f2933 !important;
  box-shadow:
    0 10rpx 0 rgba(0, 0, 0, 0.22),
    0 0 24rpx rgba(154, 106, 22, 0.2);
  transform-origin: right bottom;
  animation: supplyBubblePop 260ms ease-out;
}

.timed-supply-bubble text {
  color: inherit;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}
.supply-lunch {
  border-color: rgba(154, 106, 22, 0.56) !important;
}
.supply-commute {
  border-color: rgba(0, 219, 233, 0.56) !important;
}

.bubble-action::after {
  border: 0;
}

.bubble-action {
  align-self: flex-start;
  min-height: 44rpx;
  margin: 0;
  padding: 0 16rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 20rpx;
  font-weight: 900;
  line-height: 44rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.28),
    4rpx 4rpx 0 rgba(31, 41, 51, 0.26);
}

.bubble-action:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.18),
    1rpx 1rpx 0 rgba(31, 41, 51, 0.3);
}

.supply-bubble-dismissing {
  animation: supplyBubbleVanish 360ms ease-in forwards;
}

.smoke-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.smoke-puff {
  position: absolute;
  width: 48rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background:
    radial-gradient(circle at 34% 40%, rgba(255, 255, 255, 0.96) 0 22%, transparent 24%),
    radial-gradient(circle at 58% 34%, rgba(226, 232, 240, 0.92) 0 28%, transparent 30%),
    radial-gradient(circle at 48% 62%, rgba(148, 163, 184, 0.72) 0 30%, transparent 32%);
  filter: blur(1rpx);
  opacity: 0;
  transform: translate3d(0, 0, 0) scale(0.45);
  animation: smokePuff 620ms ease-out forwards;
}

.smoke-puff-1 {
  left: 18rpx;
  top: 28rpx;
  animation-name: smokePuffOne;
}
.smoke-puff-2 {
  left: 112rpx;
  top: 18rpx;
  width: 58rpx;
  height: 40rpx;
  animation-name: smokePuffTwo;
}
.smoke-puff-3 {
  right: 34rpx;
  top: 48rpx;
  animation-name: smokePuffThree;
}
.smoke-puff-4 {
  left: 54rpx;
  bottom: 16rpx;
  width: 56rpx;
  height: 38rpx;
  animation-name: smokePuffFour;
}
.smoke-puff-5 {
  right: 58rpx;
  bottom: 20rpx;
  width: 64rpx;
  height: 42rpx;
  animation-name: smokePuffFive;
}

@keyframes supplyBubblePop {
  from {
    opacity: 0;
    transform: translateY(14rpx) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes supplyBubbleVanish {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(10rpx) scale(0.82);
  }
}

@keyframes smokePuffOne {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.38);
  }
  18% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
    transform: translate3d(-78rpx, -46rpx, 0) scale(1.85);
  }
}

@keyframes smokePuffTwo {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.38);
  }
  18% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
    transform: translate3d(4rpx, -72rpx, 0) scale(1.85);
  }
}

@keyframes smokePuffThree {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.38);
  }
  18% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
    transform: translate3d(72rpx, -40rpx, 0) scale(1.85);
  }
}

@keyframes smokePuffFour {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.38);
  }
  18% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
    transform: translate3d(-52rpx, 42rpx, 0) scale(1.85);
  }
}

@keyframes smokePuffFive {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.38);
  }
  18% {
    opacity: 0.94;
  }
  100% {
    opacity: 0;
    transform: translate3d(66rpx, 50rpx, 0) scale(1.85);
  }
}

.hero-asset-mask {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 289rpx;
  height: 289rpx;
  overflow: hidden;
  border: 0;
  background: transparent;
  z-index: 1;
}

.hero-asset-image {
  width: 100%;
  height: 100%;
}
.hero-asset-hidden {
  border: 0;
}

.hero-card-office .hero-asset-mask {
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  border-radius: 15rpx;
  z-index: 0;
}

.hero-card-hidden .hero-asset-mask {
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  border-radius: 15rpx;
  z-index: 0;
}

.hero-card-hidden .hero-asset-image {
  width: 100%;
  height: 100%;
}

.hero-stealth-entry-btn {
  position: absolute;
  right: 22rpx;
  bottom: 22rpx;
  z-index: 32;
  display: inline-flex;
  min-width: 150rpx;
  min-height: 40rpx;
  align-items: center;
  justify-content: center;
  padding: 0 16rpx;
  border: 2rpx solid var(--camp-gold);
  border-radius: 4rpx;
  background: rgba(8, 9, 12, 0.48);
  color: #ffe7a3;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.2;
  box-shadow: none;
}

.hero-stealth-entry-btn::after {
  border: 0;
}

.hero-stealth-entry-btn:active {
  background: rgba(154, 106, 22, 0.12);
}

/* 设置栏 */
.covenant-banner {
  padding: 16rpx 24rpx !important;
}
.covenant-text {
  font-size: 22rpx;
  color: var(--camp-text-soft);
  font-weight: 600;
}
.enter-arrow {
  color: var(--camp-text-soft);
  font-size: 30rpx;
}

/* 倒计时 */
.countdown-grid {
  gap: 12rpx;
}

.countdown {
  display: flex;
  min-height: 206rpx;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 10rpx;
  padding: 18rpx 10rpx !important;
  text-align: center;
}

.countdown-heading {
  display: flex;
  min-height: 46rpx;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 16rpx;
}

.countdown-icon {
  width: 42rpx;
  height: 42rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.countdown-value-row {
  display: flex;
  min-height: 58rpx;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
}
.countdown-label {
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 25rpx;
  font-weight: 900;
  line-height: 1.26;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.countdown-value {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.1;
  font-family: var(--vs-font-display);
  white-space: nowrap;
}

.font-green {
  color: var(--camp-text-strong);
}
.font-blue {
  color: var(--camp-text-strong);
}
.font-yellow {
  color: var(--camp-text-strong);
}
.font-red {
  color: var(--camp-text-strong);
}
.font-muted {
  color: var(--camp-text-strong);
  font-size: 28rpx;
}

.unit-text {
  color: var(--camp-text-strong);
  font-size: 18rpx;
  font-weight: 700;
}
.countdown-desc {
  overflow: hidden;
  font-size: 18rpx;
  color: var(--camp-text-strong);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 今日生存消耗大卡 */
.survival-card {
  position: relative;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  gap: 16rpx;
}

.survival-card-bg,
.survival-card-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.survival-card-bg {
  z-index: 0;
}

.survival-card-shade {
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      var(--camp-asset-shade-strong) 0%,
      var(--camp-asset-shade-medium) 48%,
      var(--camp-asset-shade-soft) 100%
    ),
    linear-gradient(
      180deg,
      var(--camp-asset-shade-soft) 0%,
      var(--camp-asset-shade-soft) 48%,
      var(--camp-asset-shade-medium) 100%
    );
}

.vs-mode-workplace .survival-card {
  border-color: var(--camp-border) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0)), var(--camp-card) !important;
  box-shadow:
    var(--camp-inset-highlight),
    var(--camp-inset-lowlight),
    0 10rpx 22rpx rgba(17, 24, 39, 0.1) !important;
}

.vs-mode-workplace .survival-card-shade {
  display: none;
}

.vs-mode-workplace .survival-card-bg {
  display: none;
}

.survival-card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.survival-card-header {
  align-items: center;
}
.survival-card-title {
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.94);
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.62);
}
.survival-detail-link {
  font-size: 22rpx;
  color: #ffe7a3;
  font-weight: 700;
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.62);
}

.vs-mode-workplace .survival-card-title {
  color: var(--camp-text-strong);
  text-shadow: none;
}

.vs-mode-workplace .survival-detail-link {
  color: var(--camp-gold);
  text-shadow: none;
}

.survival-amounts {
  gap: 12rpx;
}

.survival-amount-item {
  position: relative;
  min-height: 136rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1rpx solid var(--camp-border);
  border-radius: 12rpx;
  background: var(--camp-surface);
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.08),
    inset 0 -18rpx 28rpx rgba(0, 0, 0, 0.28);
  box-sizing: border-box;
}

.survival-amount-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.survival-amount-content {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  min-height: 80rpx;
  padding: 8rpx 10rpx 10rpx;
  border-top: 0;
  background: transparent;
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.68);
  box-sizing: border-box;
}

.vs-mode-hermit .survival-amount-content {
  border-top: 1rpx solid rgba(154, 106, 22, 0.16);
  background: rgba(24, 19, 31, 0.72);
  box-shadow: none;
}

.vs-mode-workplace .survival-amount-content {
  border-top: 1rpx solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.76);
  text-shadow: none;
  box-shadow: 0 -6rpx 14rpx rgba(17, 24, 39, 0.08);
}

.survival-cat-label {
  overflow: hidden;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 800;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.survival-cat-amount {
  overflow: hidden;
  font-size: 26rpx;
  font-weight: 900;
  color: var(--camp-gold);
  font-family: var(--vs-font-display);
  line-height: 1.08;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vs-mode-workplace .survival-cat-amount {
  color: var(--camp-gold);
  text-shadow: none;
}

.vs-mode-workplace .survival-cat-label {
  color: #17130f;
  text-shadow: none;
}

.vs-mode-workplace .survival-cat-amount.amount-masked-sm {
  color: rgba(154, 106, 22, 0.82);
}

.amount-masked-sm {
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 2rpx;
}

/* 主卡内嵌设置按钮 */
.hero-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 6rpx;
  padding: 8rpx 14rpx;
  border: 2rpx solid rgba(236, 178, 255, 0.3);
  border-radius: 4rpx;
  background: var(--camp-surface);
  align-self: flex-start;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.2),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.32);
}

.hero-card-office .hero-settings-btn {
  border-color: rgba(154, 106, 22, 0.44);
  background: rgba(255, 250, 241, 0.84);
  color: #7a5519;
  box-shadow:
    inset 0 -3rpx 0 rgba(154, 106, 22, 0.1),
    3rpx 3rpx 0 rgba(154, 106, 22, 0.16);
}

.hero-settings-btn:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.18),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.32);
}

.hero-settings-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.hero-settings-text {
  font-size: 20rpx;
  color: var(--camp-text-soft);
}

.hero-card-office .hero-settings-text {
  color: #7a5519;
  text-shadow: none;
}

/* 两个核心入口卡 */
.entry-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 252rpx;
  overflow: hidden;
  padding: 28rpx 24rpx !important;
  border-width: 2rpx !important;
  border-radius: 12rpx !important;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.18),
    inset 0 -10rpx 0 rgba(0, 0, 0, 0.14),
    0 10rpx 18rpx rgba(0, 0, 0, 0.26);
  box-sizing: border-box;
}

.entry-card-daily {
  border-color: rgba(102, 255, 214, 0.42) !important;
  background:
    linear-gradient(135deg, rgba(105, 255, 219, 0.16), transparent 42%),
    linear-gradient(160deg, #127c72 0%, #0b5d5a 58%, #073f44 100%) !important;
}

.entry-card-supply {
  border-color: rgba(255, 190, 92, 0.5) !important;
  background:
    linear-gradient(135deg, rgba(255, 214, 119, 0.18), transparent 42%),
    linear-gradient(160deg, #a5621a 0%, #88440f 58%, #5f2f0f 100%) !important;
}

.vs-mode-workplace .entry-card {
  border-width: 1rpx !important;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    inset 0 -8rpx 18rpx rgba(255, 255, 255, 0.2),
    0 8rpx 18rpx rgba(17, 24, 39, 0.1) !important;
}

.vs-mode-workplace .entry-card.entry-card-daily {
  border-color: rgba(21, 197, 176, 0.58) !important;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(160deg, #28d0bd 0%, #15c5b0 56%, #10ad9d 100%) !important;
}

.vs-mode-workplace .entry-card.entry-card-supply {
  border-color: rgba(218, 114, 15, 0.58) !important;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(160deg, #e28324 0%, #da720f 56%, #c5640d 100%) !important;
}

.vs-mode-hermit .entry-card.entry-card-daily {
  border-color: rgba(102, 255, 214, 0.42) !important;
  background:
    linear-gradient(135deg, rgba(105, 255, 219, 0.16), transparent 42%),
    linear-gradient(160deg, #127c72 0%, #0b5d5a 58%, #073f44 100%) !important;
}

.vs-mode-hermit .entry-card.entry-card-supply {
  border-color: rgba(255, 190, 92, 0.5) !important;
  background:
    linear-gradient(135deg, rgba(255, 214, 119, 0.18), transparent 42%),
    linear-gradient(160deg, #a5621a 0%, #88440f 58%, #5f2f0f 100%) !important;
}

.entry-card-texture {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1rpx, transparent 1rpx),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06) 1rpx, transparent 1rpx),
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.16) 0 2rpx, transparent 3rpx),
    radial-gradient(circle at 78% 72%, rgba(0, 0, 0, 0.18) 0 3rpx, transparent 4rpx);
  background-size:
    16rpx 16rpx,
    16rpx 16rpx,
    76rpx 62rpx,
    92rpx 80rpx;
  opacity: 0.42;
}

.vs-mode-workplace .entry-card-texture {
  background:
    linear-gradient(90deg, rgba(17, 24, 39, 0.13) 1rpx, transparent 1rpx),
    linear-gradient(180deg, rgba(17, 24, 39, 0.1) 1rpx, transparent 1rpx),
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.5) 0 2rpx, transparent 3rpx),
    radial-gradient(circle at 78% 72%, rgba(17, 24, 39, 0.12) 0 3rpx, transparent 4rpx);
  background-size:
    16rpx 16rpx,
    16rpx 16rpx,
    76rpx 62rpx,
    92rpx 80rpx;
  opacity: 0.44;
}

.entry-card::after {
  content: "";
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  z-index: 0;
  width: 92rpx;
  height: 24rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.16);
  filter: blur(8rpx);
}

.vs-mode-workplace .entry-card::after {
  background: rgba(17, 24, 39, 0.18);
  filter: blur(10rpx);
}

.vs-mode-workplace .entry-card-daily::after {
  background: rgba(5, 84, 78, 0.22);
}

.vs-mode-workplace .entry-card-supply::after {
  background: rgba(98, 43, 5, 0.22);
}

.entry-card-top {
  position: absolute;
  top: 16rpx;
  right: 14rpx;
  z-index: 2;
  width: 88rpx;
  height: 88rpx;
}

.entry-icon-floating {
  animation: entryIconFloat 1800ms ease-in-out infinite;
  will-change: transform;
}

.entry-icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.entry-icon-token {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.entry-icon-image {
  width: 88rpx;
  height: 88rpx;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.entry-badge {
  position: absolute;
  top: 6rpx;
  right: -6rpx;
  z-index: 4;
  padding: 2rpx 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.42);
  border-radius: 2rpx;
  font-size: 16rpx;
  font-weight: 900;
}

.entry-badge-new {
  background: #ef4444;
  color: #fff8f2;
}

.entry-title {
  position: relative;
  z-index: 1;
  display: block;
  margin-bottom: 42rpx;
  padding-right: 96rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: var(--camp-text-strong);
  font-family: var(--vs-font-display);
  line-height: 1.18;
}

.vs-mode-workplace .entry-card .entry-title {
  color: #052f2c;
  text-shadow: none;
}

.vs-mode-workplace .entry-card-supply .entry-title {
  color: #3d1d06;
}

.vs-mode-workplace .entry-card .entry-desc {
  color: rgba(5, 47, 44, 0.88);
  font-weight: 800;
  text-shadow: none;
}

.vs-mode-workplace .entry-card-supply .entry-desc {
  color: rgba(61, 29, 6, 0.86);
}

.vs-mode-workplace .entry-card .entry-action {
  border: 1rpx solid rgba(255, 253, 248, 0.62);
  background: rgba(255, 253, 248, 0.36);
  color: #052f2c;
  font-weight: 900;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    0 4rpx 10rpx rgba(17, 24, 39, 0.08);
}

.vs-mode-workplace .entry-card-daily .entry-action {
  background: rgba(230, 255, 247, 0.34);
}

.vs-mode-workplace .entry-card-supply .entry-action {
  background: rgba(255, 244, 223, 0.34);
  color: #3d1d06;
}

.entry-desc {
  position: relative;
  z-index: 1;
  display: flex;
  margin-bottom: 8rpx;
  min-height: 64rpx;
  flex-direction: column;
  justify-content: flex-start;
  gap: 4rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.84);
  line-height: 1.38;
  flex: none;
}

.entry-desc-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entry-action {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  margin-top: 0;
  min-width: 104rpx;
  padding: 8rpx 16rpx;
  border: 2rpx solid rgba(255, 253, 248, 0.64);
  border-radius: 4rpx;
  background: rgba(255, 253, 248, 0.22);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.2;
  color: #fff6c7;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.14),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.16);
}

@keyframes entryIconFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8rpx);
  }
}
</style>
