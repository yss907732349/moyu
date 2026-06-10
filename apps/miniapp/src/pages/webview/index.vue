<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useVisualModePage } from "../../services/visual-mode";

const targetUrl = ref("");
const { visualModeClass } = useVisualModePage();

onLoad((query) => {
  targetUrl.value = typeof query?.url === "string" ? decodeURIComponent(query.url) : "";
});
</script>

<template>
  <web-view v-if="targetUrl" :src="targetUrl" />
  <view v-else :class="['webview-empty', visualModeClass]">补给落地页暂不可用</view>
</template>

<style scoped>
.webview-empty {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--camp-page);
  color: var(--camp-text-soft);
  font-size: 28rpx;
}
</style>
