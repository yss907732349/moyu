<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const { visualModeClass } = useVisualModePage();

type PolicyType = "privacy" | "agreement" | "miniappPrivacy";

type PolicySection = {
  title: string;
  body: string[];
};

type PolicyDocument = {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: PolicySection[];
};

const activeType = ref<PolicyType>("privacy");

const policyDocuments: Record<PolicyType, PolicyDocument> = {
  privacy: {
    title: "隐私政策",
    subtitle: "说明摸鱼隐者在社区发布、内容安全、举报治理和后台运营中如何处理个人信息。",
    updatedAt: "2026-06-08",
    sections: [
      {
        title: "我们会处理的信息",
        body: [
          "当你登录、创建隐者档案、发帖、评论、回复、上传图片、点赞、收藏或举报时，系统会处理必要的账号标识、隐者档案、社区内容、互动记录、审核记录和举报处理记录。",
          "社区发帖、评论和回复前，需要先同意当前隐私政策和社区用户协议，再完成微信手机号验证。服务端只保存验证状态、验证时间、验证来源和必要哈希材料，不在公开页面展示完整手机号或手机号尾号。"
        ]
      },
      {
        title: "手机号验证边界",
        body: [
          "手机号验证只用于社区发布门槛和后台合规状态判断。未完成验证时，你仍可浏览公开内容；点赞、收藏和举报按登录、建档和治理状态处理，不强制手机号验证。",
          "公开帖子、评论、回复、作者快照、通知、公开个人主页或普通资料页不会展示完整手机号、手机号尾号或“已验证手机号”徽章。后台常规治理页面只展示是否完成验证的布尔状态和协议版本摘要。"
        ]
      },
      {
        title: "IP 属地展示边界",
        body: [
          "当你成功发帖、评论或回复时，服务端会从可信请求来源识别客户端 IP，并保存发布时的降精度 IP 属地快照。",
          "公开侧最多展示境内省、自治区、直辖市或境外国家/地区，例如“IP属地：广东”“IP属地：日本”或“IP属地：未知”。系统不会公开完整 IP、市、区县、街道或 IP 来源 header，也不会根据当前请求为历史无属地内容补造真实属地。",
          "提审包和生产包默认展示帖子详情、评论、回复和公开个人主页的 IP 属地，普通用户不能关闭或自定义。"
        ]
      },
      {
        title: "内容安全与举报治理",
        body: [
          "昵称、帖子、评论、回复和社区图片可能进入内容安全审核流程。系统可能使用本地敏感词、微信内容安全、AI 辅助审核和人工复核。图片审核可能通过异步回调完成，在结果确认前内容可能仅作者本人可见或进入人工复核。",
          "举报治理会记录举报目标、举报原因、处理动作和必要审计信息。后台运营人员可基于内容 ID、作者用户 ID、手机号验证布尔状态、协议版本、降精度 IP 属地、内容安全摘要和举报处理状态执行审核、隐藏、移除、禁言、封禁或解除治理。"
        ]
      },
      {
        title: "保存和安全",
        body: [
          "隐私同意版本、手机号验证状态、社区发布 IP 属地快照、内容安全结果、举报和治理审计会按社区运营、合规留痕和安全排查需要保存。",
          "后台常规响应不得包含完整手机号、明文 IP、微信 openid、unionid、sessionKey、登录 token、供应商密钥或供应商完整原始响应。"
        ]
      }
    ]
  },
  agreement: {
    title: "社区用户协议",
    subtitle: "说明你在隐者营地发帖、评论、回复、举报和接受治理处理时的基本规则。",
    updatedAt: "2026-06-08",
    sections: [
      {
        title: "发布准入",
        body: [
          "你浏览社区、点赞、收藏和举报公开内容时，按既有登录、隐者档案和治理状态边界处理。你发帖、评论或回复前，必须先同意当前版本隐私政策和社区用户协议，并完成微信手机号验证。",
          "若你未登录、未创建隐者档案、未同意当前协议、未完成验证，或账号处于限制、禁言、封禁状态，系统可以拒绝发帖、评论或回复，并给出对应提示。服务端拒绝后，小程序不得伪造提交成功或创建待审核内容。"
        ]
      },
      {
        title: "内容规则",
        body: [
          "请不要发布违法违规、骚扰攻击、隐私泄露、广告引流、色情低俗、虚假误导、恶意刷屏或破坏社区体验的内容。",
          "社区内容可能经过本地规则、微信内容安全、AI 辅助审核和人工复核。低风险内容可以自动公开；需要复核的内容会进入待审核状态；明确违规内容可能被驳回、隐藏或移除。"
        ]
      },
      {
        title: "IP 属地",
        body: [
          "你成功发帖、评论或回复时，系统会由服务端根据可信请求来源生成发布时 IP 属地快照。帖子详情、评论、回复和公开个人主页会展示降精度 IP 属地。",
          "你不能关闭、隐藏或自定义 IP 属地展示。社区不会公开完整 IP、市、区县、街道、IP 来源 header 或解析原始结果。历史无属地快照内容不会被当前请求补造真实属地。"
        ]
      },
      {
        title: "举报和治理",
        body: [
          "你可以举报公开帖子、评论或回复。系统会进行重复举报、自己举报自己、非公开内容和频率限制校验。",
          "后台可以根据内容安全结果、举报情况、历史有效举报风险和人工判断，对内容执行保留、隐藏、移除、标记误报等处理；也可以对用户执行限制、禁言、封禁或解除治理。"
        ]
      },
      {
        title: "异议和申诉",
        body: [
          "如果你认为内容审核、举报处理、隐藏、移除、禁言或封禁结果存在错误，可以通过小程序内反馈入口或客服渠道提交说明。",
          "第一版不提供完整申诉中心、实名核身、身份证、人脸识别或手机号尾号排查能力。后续新增相关能力前，应先更新协议、隐私政策和实现规格。"
        ]
      }
    ]
  },
  miniappPrivacy: {
    title: "小程序用户隐私保护指引",
    subtitle: "说明社区发布流程中微信能力、业务同意和最小必要处理的关系。",
    updatedAt: "2026-06-08",
    sections: [
      {
        title: "使用微信能力前的告知",
        body: [
          "在拉起微信手机号验证组件前，小程序会先展示隐私政策、社区用户协议和本指引入口，并要求你主动勾选同意。",
          "你拒绝或取消同意时，小程序不会调用微信手机号验证，也不会提交发帖、评论或回复内容。"
        ]
      },
      {
        title: "微信手机号验证",
        body: [
          "手机号验证通过微信提供的组件完成，小程序会把微信返回的动态 code 发送给服务端，由服务端调用微信接口确认验证结果。",
          "微信登录 code 和手机号验证 code 是不同凭证，服务端不得混用。验证失败、code 失效或服务端无法确认时，你会保持未验证状态，可以重新点击验证按钮重试。"
        ]
      },
      {
        title: "公开展示限制",
        body: [
          "手机号验证不会变成公开身份资产。公开帖子、评论、回复、作者快照、通知、公开个人主页和普通资料页不会展示手机号、手机号尾号或已验证手机号徽章。",
          "社区公开展示的 IP 属地由服务端在发布时生成，展示精度限制为省、自治区、直辖市或境外国家/地区。"
        ]
      },
      {
        title: "你可以怎么做",
        body: [
          "如果你暂时不想完成手机号验证，可以继续浏览公开内容。需要发帖、评论或回复时，再按页面提示完成同意和验证。",
          "如果验证失败，请重新点击“微信手机号验证”。本地调试或内测环境需要确认后端已配置手机号验证 mock 或真实微信小程序凭据。"
        ]
      }
    ]
  }
};

const currentPolicy = computed(() => policyDocuments[activeType.value]);

onLoad((query: { type?: string } = {}) => {
  if (query.type === "agreement" || query.type === "miniappPrivacy" || query.type === "privacy") {
    activeType.value = query.type;
  }
});
</script>

<template>
  <view :class="['vs-page', 'policy-page', visualModeClass]">
    <view class="vs-panel policy-hero">
      <text class="policy-kicker">社区发布规则</text>
      <text class="policy-title">{{ currentPolicy.title }}</text>
      <text class="policy-subtitle">{{ currentPolicy.subtitle }}</text>
      <text class="policy-date">版本日期：{{ currentPolicy.updatedAt }}</text>
    </view>

    <view class="policy-tabs">
      <button
        class="policy-tab"
        :class="{ 'policy-tab-active': activeType === 'privacy' }"
        @tap="activeType = 'privacy'"
      >
        隐私政策
      </button>
      <button
        class="policy-tab"
        :class="{ 'policy-tab-active': activeType === 'agreement' }"
        @tap="activeType = 'agreement'"
      >
        用户协议
      </button>
      <button
        class="policy-tab"
        :class="{ 'policy-tab-active': activeType === 'miniappPrivacy' }"
        @tap="activeType = 'miniappPrivacy'"
      >
        隐私指引
      </button>
    </view>

    <view class="policy-content">
      <view
        v-for="section in currentPolicy.sections"
        :key="section.title"
        class="vs-panel section-card"
      >
        <text class="section-title">{{ section.title }}</text>
        <text v-for="paragraph in section.body" :key="paragraph" class="section-body">
          {{ paragraph }}
        </text>
      </view>
    </view>
  </view>
</template>

<style>
.policy-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx;
  background: var(--camp-page-background);
}

.policy-hero,
.section-card {
  display: flex;
  flex-direction: column;
}

.policy-hero {
  gap: 12rpx;
  border: 1rpx solid rgba(236, 178, 255, 0.3) !important;
  background: rgba(26, 26, 46, 0.92) !important;
}

.policy-kicker,
.policy-date {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
}

.policy-title {
  color: var(--camp-text-strong);
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.25;
}

.policy-subtitle {
  color: var(--camp-text-soft);
  font-size: 23rpx;
  line-height: 1.55;
}

.policy-date {
  color: var(--camp-gold);
}

.policy-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  margin: 18rpx 0;
}

.policy-tab {
  display: flex;
  min-height: 64rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 8rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 6rpx;
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  font-size: 21rpx;
  font-weight: 900;
}

.policy-tab::after {
  border: 0;
}

.policy-tab-active {
  border-color: rgba(236, 178, 255, 0.62);
  background: rgba(189, 0, 255, 0.16);
  color: var(--camp-primary);
}

.policy-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section-card {
  gap: 12rpx;
  border: 1rpx solid var(--camp-border) !important;
  background: var(--camp-card) !important;
}

.section-title {
  color: var(--camp-primary);
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.35;
}

.section-body {
  display: block;
  color: var(--camp-text);
  font-size: 24rpx;
  line-height: 1.72;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.vs-mode-workplace .policy-hero {
  border-color: var(--camp-border) !important;
  background:
    linear-gradient(135deg, rgba(47, 111, 115, 0.08), rgba(154, 106, 22, 0.08)), var(--camp-card) !important;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    0 6rpx 16rpx rgba(17, 24, 39, 0.12) !important;
}

.vs-mode-workplace .policy-kicker {
  color: #236f73;
}

.vs-mode-workplace .policy-title {
  color: var(--camp-text-strong);
}

.vs-mode-workplace .policy-subtitle {
  color: var(--camp-text);
}

.vs-mode-workplace .policy-date {
  color: #9a6a16;
}

.vs-mode-workplace .policy-tab-active {
  border-color: rgba(154, 106, 22, 0.82);
  background: var(--camp-gold);
  color: #111827;
  box-shadow:
    inset 0 3rpx 0 rgba(255, 255, 255, 0.3),
    inset 0 -5rpx 0 rgba(0, 0, 0, 0.16),
    0 5rpx 0 rgba(17, 24, 39, 0.28);
}
</style>
