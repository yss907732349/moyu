import { computed, ref, type ComputedRef } from "vue";
import { onShow } from "@dcloudio/uni-app";

export type MiniappVisualMode = "workplace" | "hermit";

export const VISUAL_MODE_STORAGE_KEY = "moyuxia.visualMode";
export const DEFAULT_VISUAL_MODE: MiniappVisualMode = "workplace";

type VisualModeChromeTokens = {
  navigationBar: {
    backgroundColor: string;
    frontColor: "#000000" | "#ffffff";
  };
  tabBar: {
    backgroundColor: string;
    borderStyle: "black" | "white";
    color: string;
    selectedColor: string;
  };
};

export const visualModeChromeTokens: Record<MiniappVisualMode, VisualModeChromeTokens> = {
  workplace: {
    navigationBar: {
      backgroundColor: "#f7f3ea",
      frontColor: "#000000"
    },
    tabBar: {
      backgroundColor: "#fbf8f1",
      borderStyle: "white",
      color: "#6f655a",
      selectedColor: "#9a6a16"
    }
  },
  hermit: {
    navigationBar: {
      backgroundColor: "#050508",
      frontColor: "#ffffff"
    },
    tabBar: {
      backgroundColor: "#050508",
      borderStyle: "black",
      color: "#9d8ba0",
      selectedColor: "#ecb2ff"
    }
  }
};

const currentVisualMode = ref<MiniappVisualMode>(readStoredVisualMode());

export function getVisualMode(): MiniappVisualMode {
  currentVisualMode.value = readStoredVisualMode();
  return currentVisualMode.value;
}

export function saveVisualMode(mode: MiniappVisualMode): void {
  currentVisualMode.value = mode;

  try {
    uni.setStorageSync(VISUAL_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("moyuxia visual mode save failed", error);
  }

  applyVisualModeChrome(mode);
}

export function toggleVisualMode(): MiniappVisualMode {
  const nextMode: MiniappVisualMode =
    currentVisualMode.value === "workplace" ? "hermit" : "workplace";
  saveVisualMode(nextMode);
  return nextMode;
}

export function isHermitVisualMode(mode = currentVisualMode.value): boolean {
  return mode === "hermit";
}

export function isWorkplaceVisualMode(mode = currentVisualMode.value): boolean {
  return mode === "workplace";
}

export function getVisualModeClass(mode = currentVisualMode.value): string {
  return `vs-mode-${mode}`;
}

export function applyVisualModeChrome(mode = currentVisualMode.value): void {
  const tokens = visualModeChromeTokens[mode];

  try {
    uni.setNavigationBarColor({
      frontColor: tokens.navigationBar.frontColor,
      backgroundColor: tokens.navigationBar.backgroundColor,
      animation: {
        duration: 120,
        timingFunc: "easeIn"
      }
    });
  } catch (error) {
    console.warn("moyuxia navigation visual mode apply failed", error);
  }

  try {
    uni.setTabBarStyle({
      color: tokens.tabBar.color,
      selectedColor: tokens.tabBar.selectedColor,
      backgroundColor: tokens.tabBar.backgroundColor,
      borderStyle: tokens.tabBar.borderStyle
    });
  } catch {
    // 非 tab 页或运行环境不支持 tabBar 时忽略，导航栏仍可按当前模式更新。
  }
}

export function useVisualModePage(options: { forceMode?: MiniappVisualMode } = {}): {
  visualMode: ComputedRef<MiniappVisualMode>;
  visualModeClass: ComputedRef<string>;
  isHermitMode: ComputedRef<boolean>;
  isWorkplaceMode: ComputedRef<boolean>;
} {
  const visualMode = computed(() => options.forceMode ?? currentVisualMode.value);
  const visualModeClass = computed(() => getVisualModeClass(visualMode.value));
  const isHermitMode = computed(() => visualMode.value === "hermit");
  const isWorkplaceMode = computed(() => visualMode.value === "workplace");

  onShow(() => {
    if (!options.forceMode) {
      currentVisualMode.value = readStoredVisualMode();
    }

    applyVisualModeChrome(visualMode.value);
  });

  return {
    visualMode,
    visualModeClass,
    isHermitMode,
    isWorkplaceMode
  };
}

function readStoredVisualMode(): MiniappVisualMode {
  try {
    return normalizeVisualMode(uni.getStorageSync(VISUAL_MODE_STORAGE_KEY));
  } catch (error) {
    console.warn("moyuxia visual mode read failed", error);
    return DEFAULT_VISUAL_MODE;
  }
}

function normalizeVisualMode(value: unknown): MiniappVisualMode {
  return value === "hermit" || value === "workplace" ? value : DEFAULT_VISUAL_MODE;
}
