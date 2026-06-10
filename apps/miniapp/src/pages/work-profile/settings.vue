<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, onMounted, ref } from "vue";
import {
  CurrencyCode,
  PaydayWeekendStrategy,
  SalaryMode,
  WorkProfileValidationError,
  WorkdayRuleType,
  formatDisplayTime,
  validateWorkProfile,
  type SaveWorkProfileRequest,
  type Weekday,
  type WorkBreak,
  type WorkProfileSnapshot
} from "@moyuxia/shared";
import {
  getWorkProfile,
  normalizeWorkProfileError,
  saveLocalWorkProfileSnapshot,
  saveWorkProfile
} from "../../services/work-profile";

const { visualModeClass } = useVisualModePage();

const weekdayOptions: Array<{ label: string; value: Weekday }> = [
  { label: "一", value: 1 },
  { label: "二", value: 2 },
  { label: "三", value: 3 },
  { label: "四", value: 4 },
  { label: "五", value: 5 },
  { label: "六", value: 6 },
  { label: "日", value: 7 }
];
const paydayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1));
const paydayStrategyOptions = [
  { label: "按自然日", value: PaydayWeekendStrategy.KeepCalendarDay },
  { label: "提前到工作日", value: PaydayWeekendStrategy.PreviousWorkday },
  { label: "顺延到工作日", value: PaydayWeekendStrategy.NextWorkday }
];

const loading = ref(false);
const saving = ref(false);
const configured = ref(false);
const globalError = ref("");
const successMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});
const latestSnapshot = ref<WorkProfileSnapshot | null>(null);

const monthlyAmount = ref("6000");
const startTime = ref("09:30");
const endTime = ref("18:30");
const breakEnabled = ref(true);
const breakStartTime = ref("12:00");
const breakEndTime = ref("13:30");
const workdayType = ref<WorkdayRuleType>(WorkdayRuleType.StandardWeekdays);
const selectedWeekdays = ref<Weekday[]>([1, 2, 3, 4, 5]);
const paydayDay = ref(9);
const paydayStrategyIndex = ref(0);
const hideModeEnabled = ref(false); // 保留字段兼容，不再展示 UI

const paydayLabel = computed(() => `${paydayDay.value} 号`);
const paydayStrategyLabel = computed(() => paydayStrategyOptions[paydayStrategyIndex.value].label);
const selectedWeekdayText = computed(() =>
  selectedWeekdays.value
    .map((value) => weekdayOptions.find((item) => item.value === value)?.label)
    .filter(Boolean)
    .join("、")
);
const canSave = computed(() => !loading.value && !saving.value);

onMounted(() => {
  void loadProfile();
});

async function loadProfile(): Promise<void> {
  loading.value = true;
  globalError.value = "";

  try {
    const response = await getWorkProfile();
    configured.value = response.profile !== null;

    if (response.profile) {
      fillFormFromSnapshot(response.profile);
    }

    if (response.snapshot) {
      latestSnapshot.value = response.snapshot;
      saveLocalWorkProfileSnapshot(response.snapshot);
    }
  } catch (error) {
    globalError.value = normalizeWorkProfileError(error).message;
  } finally {
    loading.value = false;
  }
}

function fillFormFromSnapshot(snapshot: WorkProfileSnapshot): void {
  monthlyAmount.value = String(snapshot.salary.monthlyAmount);
  startTime.value = snapshot.workTime.startTime;
  endTime.value = snapshot.workTime.endTime;
  const firstBreak = snapshot.workTime.breaks[0];
  breakEnabled.value = Boolean(firstBreak);
  breakStartTime.value = firstBreak?.startTime ?? "12:00";
  breakEndTime.value = firstBreak?.endTime ?? "13:30";
  workdayType.value = snapshot.workdays.type;
  selectedWeekdays.value = [...snapshot.workdays.weekdays] as Weekday[];
  paydayDay.value = snapshot.payday.dayOfMonth;
  paydayStrategyIndex.value = Math.max(
    0,
    paydayStrategyOptions.findIndex((item) => item.value === snapshot.payday.weekendStrategy)
  );
  hideModeEnabled.value = snapshot.hideModeEnabled;
}

function buildRequest(): SaveWorkProfileRequest {
  const breaks: WorkBreak[] = breakEnabled.value
    ? [
        {
          id: "lunch",
          label: "休息段",
          startTime: breakStartTime.value,
          endTime: breakEndTime.value
        }
      ]
    : [];

  return {
    profile: {
      userId: "client-dev-placeholder",
      salary: {
        mode: SalaryMode.SimpleMonthly,
        monthlyAmount: Number(monthlyAmount.value),
        currency: CurrencyCode.CNY
      },
      workTime: {
        startTime: startTime.value,
        endTime: endTime.value,
        breaks
      },
      workdays: {
        type: workdayType.value,
        weekdays:
          workdayType.value === WorkdayRuleType.StandardWeekdays
            ? ([1, 2, 3, 4, 5] as const)
            : selectedWeekdays.value
      },
      payday: {
        dayOfMonth: paydayDay.value,
        weekendStrategy: paydayStrategyOptions[paydayStrategyIndex.value].value
      },
      hideModeEnabled: hideModeEnabled.value
    }
  };
}

async function handleSave(): Promise<void> {
  if (!canSave.value) {
    return;
  }

  const request = buildRequest();
  fieldErrors.value = {};
  globalError.value = "";
  successMessage.value = "";

  try {
    validateWorkProfile(request.profile);
  } catch (error) {
    if (error instanceof WorkProfileValidationError) {
      fieldErrors.value = Object.fromEntries(
        error.issues.map((issue) => [issue.field, issue.message])
      );
      globalError.value = "请先修正标红的设置";
      return;
    }
  }

  saving.value = true;
  try {
    const response = await saveWorkProfile(request);
    latestSnapshot.value = response.snapshot;
    configured.value = true;
    saveLocalWorkProfileSnapshot(response.snapshot);
    successMessage.value = "工作档案已封印，正在返回首页查看实时已摸金额";
    uni.showToast({ title: "保存成功", icon: "success" });
    setTimeout(() => {
      uni.switchTab({ url: "/pages/home/index" });
    }, 650);
  } catch (error) {
    const normalized = normalizeWorkProfileError(error);
    fieldErrors.value = normalized.fieldErrors;
    globalError.value = normalized.message;
  } finally {
    saving.value = false;
  }
}

function toggleWeekday(value: Weekday): void {
  if (workdayType.value !== WorkdayRuleType.CustomWeekdays) {
    return;
  }

  selectedWeekdays.value = selectedWeekdays.value.includes(value)
    ? selectedWeekdays.value.filter((item) => item !== value)
    : [...selectedWeekdays.value, value].sort((first, second) => first - second);
}

function selectStandardWorkdays(): void {
  workdayType.value = WorkdayRuleType.StandardWeekdays;
  selectedWeekdays.value = [1, 2, 3, 4, 5];
}

function selectCustomWorkdays(): void {
  workdayType.value = WorkdayRuleType.CustomWeekdays;
}

function errorFor(fields: string[]): string {
  for (const field of fields) {
    if (fieldErrors.value[field]) {
      return fieldErrors.value[field];
    }
  }

  return "";
}

function onMonthlyAmountInput(event: Event): void {
  monthlyAmount.value = String((event.target as HTMLInputElement).value ?? "");
}

function getSwitchValue(event: Event): boolean {
  return Boolean((event as unknown as { detail?: { value?: boolean } }).detail?.value);
}

function onBreakSwitchChange(event: Event): void {
  breakEnabled.value = getSwitchValue(event);
}

function onPaydayChange(event: { detail: { value: number } }): void {
  paydayDay.value = Number(event.detail.value) + 1;
}

function onPaydayStrategyChange(event: { detail: { value: number } }): void {
  paydayStrategyIndex.value = Number(event.detail.value);
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', 'settings-page', visualModeClass]">
    <view class="page-head">
      <text class="vs-title page-title">薪资时间卷轴</text>
      <text class="vs-subtitle page-subtitle">
        {{ configured ? "已读取你的当前工作档案" : "填写第一份本人工作档案" }}
      </text>
    </view>

    <view v-if="globalError" class="notice notice-error">
      <text>{{ globalError }}</text>
    </view>
    <view v-if="successMessage" class="notice notice-success">
      <text>{{ successMessage }}</text>
    </view>

    <view class="vs-panel vs-card-raised form-section">
      <view class="section-head">
        <text class="section-title">薪资</text>
        <text class="section-mark">人民币 · 月薪估算</text>
      </view>
      <view class="field">
        <text class="field-label">月薪金额</text>
        <input
          class="field-input"
          type="digit"
          :value="monthlyAmount"
          placeholder="例如 6000"
          @input="onMonthlyAmountInput"
        />
        <text v-if="errorFor(['salary.monthlyAmount', 'salary'])" class="field-error">
          {{ errorFor(["salary.monthlyAmount", "salary"]) }}
        </text>
      </view>
    </view>

    <view class="vs-panel vs-card-raised form-section">
      <view class="section-head">
        <text class="section-title">上班时段</text>
        <text class="section-mark">本地实时计算输入</text>
      </view>
      <view class="time-grid">
        <picker mode="time" :value="startTime" @change="startTime = $event.detail.value">
          <view class="picker-field">
            <text class="field-label">开始</text>
            <text class="picker-value">{{ startTime }}</text>
          </view>
        </picker>
        <picker mode="time" :value="endTime" @change="endTime = $event.detail.value">
          <view class="picker-field">
            <text class="field-label">结束</text>
            <text class="picker-value">{{ endTime }}</text>
          </view>
        </picker>
      </view>
      <text
        v-if="errorFor(['workTime.endTime', 'workTime.startTime', 'workTime'])"
        class="field-error"
      >
        {{ errorFor(["workTime.endTime", "workTime.startTime", "workTime"]) }}
      </text>

      <view class="switch-row">
        <view>
          <text class="field-label">休息段</text>
          <text class="field-hint">午休或固定休息时间</text>
        </view>
        <switch :checked="breakEnabled" color="#10b981" @change="onBreakSwitchChange" />
      </view>
      <view v-if="breakEnabled" class="time-grid">
        <picker mode="time" :value="breakStartTime" @change="breakStartTime = $event.detail.value">
          <view class="picker-field">
            <text class="field-label">休息开始</text>
            <text class="picker-value">{{ breakStartTime }}</text>
          </view>
        </picker>
        <picker mode="time" :value="breakEndTime" @change="breakEndTime = $event.detail.value">
          <view class="picker-field">
            <text class="field-label">休息结束</text>
            <text class="picker-value">{{ breakEndTime }}</text>
          </view>
        </picker>
      </view>
      <text v-if="errorFor(['workTime.breaks.0', 'workTime.breaks'])" class="field-error">
        {{ errorFor(["workTime.breaks.0", "workTime.breaks"]) }}
      </text>
    </view>

    <view class="vs-panel vs-card-raised form-section">
      <view class="section-head">
        <text class="section-title">工作日</text>
        <text class="section-mark">{{ selectedWeekdayText }}</text>
      </view>
      <view class="segment-row">
        <view
          :class="[
            'segment',
            workdayType === WorkdayRuleType.StandardWeekdays ? 'segment-active' : ''
          ]"
          @click="selectStandardWorkdays"
        >
          <text>标准双休</text>
        </view>
        <view
          :class="[
            'segment',
            workdayType === WorkdayRuleType.CustomWeekdays ? 'segment-active' : ''
          ]"
          @click="selectCustomWorkdays"
        >
          <text>自定义</text>
        </view>
      </view>
      <view class="weekday-grid">
        <view
          v-for="item in weekdayOptions"
          :key="item.value"
          :class="[
            'weekday-chip',
            selectedWeekdays.includes(item.value) ? 'weekday-chip-active' : '',
            workdayType === WorkdayRuleType.StandardWeekdays ? 'weekday-chip-disabled' : ''
          ]"
          @click="toggleWeekday(item.value)"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>
      <text v-if="errorFor(['workdays.weekdays', 'workdays'])" class="field-error">
        {{ errorFor(["workdays.weekdays", "workdays"]) }}
      </text>
    </view>

    <view class="vs-panel vs-card-raised form-section">
      <view class="section-head">
        <text class="section-title">发薪日</text>
        <text class="section-mark">{{ paydayLabel }}</text>
      </view>
      <view class="time-grid">
        <picker :range="paydayOptions" :value="paydayDay - 1" @change="onPaydayChange">
          <view class="picker-field">
            <text class="field-label">每月日期</text>
            <text class="picker-value">{{ paydayLabel }}</text>
          </view>
        </picker>
        <picker
          :range="paydayStrategyOptions.map((item) => item.label)"
          :value="paydayStrategyIndex"
          @change="onPaydayStrategyChange"
        >
          <view class="picker-field">
            <text class="field-label">遇周末</text>
            <text class="picker-value">{{ paydayStrategyLabel }}</text>
          </view>
        </picker>
      </view>
      <text
        v-if="errorFor(['payday.dayOfMonth', 'payday.weekendStrategy', 'payday'])"
        class="field-error"
      >
        {{ errorFor(["payday.dayOfMonth", "payday.weekendStrategy", "payday"]) }}
      </text>
    </view>

    <view class="save-bar">
      <button class="vs-button save-button" :disabled="!canSave" @click="handleSave">
        {{ saving ? "封印中..." : "保存工作档案" }}
      </button>
      <text v-if="latestSnapshot" class="snapshot-note">
        快照更新时间：{{ formatDisplayTime(latestSnapshot.updatedAt) }}
      </text>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.settings-page {
  padding-bottom: 180rpx;
}

.page-head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.page-title {
  color: var(--camp-gold);
  font-size: 42rpx;
}

.page-subtitle {
  font-size: 22rpx;
}

.notice {
  border-radius: 8rpx;
  padding: 18rpx 22rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.notice-error {
  border: 1rpx solid rgba(255, 180, 171, 0.35);
  background: rgba(80, 0, 0, 0.28);
  color: var(--camp-danger);
}

.notice-success {
  border: 1rpx solid rgba(0, 219, 233, 0.32);
  background: rgba(0, 80, 80, 0.26);
  color: var(--camp-cyan);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section-head,
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section-title {
  display: block;
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.section-mark,
.field-hint {
  display: block;
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.field-label {
  display: block;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  font-weight: 700;
}

.field-input,
.picker-field {
  box-sizing: border-box;
  min-height: 86rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
  color: var(--camp-text);
  font-size: 28rpx;
  padding: 0 22rpx;
}

.picker-field {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;
}

.picker-value {
  color: var(--camp-gold);
  font-size: 28rpx;
  font-weight: 900;
}

.field-error {
  color: var(--camp-danger);
  font-size: 20rpx;
  line-height: 1.4;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.segment-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.segment,
.weekday-chip {
  box-sizing: border-box;
  min-height: 72rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 900;
}

.segment-active,
.weekday-chip-active {
  border-color: rgba(0, 219, 233, 0.42);
  background: rgba(0, 219, 233, 0.12);
  color: var(--camp-cyan);
}

.weekday-chip-disabled {
  opacity: 0.72;
}

.weekday-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8rpx;
}

.save-bar {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.save-button {
  width: 100%;
}
.save-button[disabled] {
  opacity: 0.58;
}

.snapshot-note {
  color: var(--camp-text-soft);
  font-size: 20rpx;
  text-align: center;
}
</style>
