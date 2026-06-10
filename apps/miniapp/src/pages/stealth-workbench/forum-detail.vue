<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  COMMUNITY_SECTION_LABELS,
  formatDisplayTime,
  type CommunityComment,
  type CommunityPostDetail
} from "@moyuxia/shared";
import {
  createCommunityComment,
  getCommunityPost,
  resolveCommunityPublicAssetUrl,
  setCommunityPostFavorite,
  setCommunityPostLike
} from "../../services/community-lite";
const { visualModeClass } = useVisualModePage({ forceMode: "workplace" });

type Attachment = CommunityPostDetail["mediaAssets"][number];

const postId = ref("");
const post = ref<CommunityPostDetail | null>(null);
const comments = ref<CommunityComment[]>([]);
const loading = ref(false);
const feedback = ref("同步中");
const attachmentListVisible = ref(false);
const currentImageUrl = ref("");
const commentBody = ref("");
const commentSubmitting = ref(false);
const commentFeedback = ref("");

const sectionLabel = computed(() =>
  post.value ? (COMMUNITY_SECTION_LABELS[post.value.sectionKey] ?? "分区") : "--"
);
const attachmentCount = computed(() => post.value?.mediaAssets.length ?? 0);
const commentRows = computed(() => {
  const rows: Array<{
    id: string;
    person: string;
    body: string;
    createdAt: string;
    level: string;
  }> = [];

  for (const comment of comments.value) {
    rows.push({
      id: comment.id,
      person: comment.author.displayName,
      body: comment.body,
      createdAt: comment.createdAt,
      level: "评论"
    });

    for (const reply of comment.replies) {
      rows.push({
        id: reply.id,
        person: reply.author.displayName,
        body: reply.body,
        createdAt: reply.createdAt,
        level: "回复"
      });
    }
  }

  return rows;
});

onLoad((query: { postId?: string } = {}) => {
  postId.value = query.postId ?? "";
  void loadDetail();
});

async function loadDetail(): Promise<void> {
  if (!postId.value) {
    feedback.value = "数据读取失败";
    return;
  }

  loading.value = true;
  feedback.value = "同步中";

  try {
    const response = await getCommunityPost(postId.value);
    post.value = response.post;
    comments.value = response.comments;
    feedback.value = "";
  } catch (error) {
    post.value = null;
    comments.value = [];
    feedback.value = error instanceof Error ? error.message : "数据读取失败";
  } finally {
    loading.value = false;
  }
}

async function toggleMark(): Promise<void> {
  if (!post.value) {
    return;
  }

  const response = await setCommunityPostLike(post.value.id, !post.value.viewerInteraction?.liked);
  post.value = {
    ...post.value,
    viewerInteraction: response.viewerInteraction,
    stats: response.stats
  };
}

async function toggleArchive(): Promise<void> {
  if (!post.value) {
    return;
  }

  const response = await setCommunityPostFavorite(
    post.value.id,
    !post.value.viewerInteraction?.favorited
  );
  post.value = {
    ...post.value,
    viewerInteraction: response.viewerInteraction,
    stats: response.stats
  };
}

async function submitComment(): Promise<void> {
  if (!post.value || commentSubmitting.value) {
    return;
  }

  const body = commentBody.value.trim();
  if (!body) {
    commentFeedback.value = "请先填写内容";
    return;
  }

  commentSubmitting.value = true;
  commentFeedback.value = "同步中";

  try {
    await createCommunityComment(post.value.id, body);
    commentBody.value = "";
    commentFeedback.value = "已提交";
    await loadDetail();
  } catch (error) {
    commentFeedback.value = error instanceof Error ? error.message : "提交失败";
  } finally {
    commentSubmitting.value = false;
  }
}

function toggleAttachmentList(): void {
  if (attachmentCount.value === 0) {
    return;
  }

  attachmentListVisible.value = !attachmentListVisible.value;
}

function openAttachment(asset: Attachment): void {
  currentImageUrl.value = resolveCommunityPublicAssetUrl(asset.url, asset.id);
}

function closeImageViewer(): void {
  currentImageUrl.value = "";
}
</script>

<template>
  <view :class="['stealth-page', visualModeClass]">
    <view class="stealth-stack">
      <view class="stealth-sheet stealth-field-table">
        <view class="stealth-sheet-title">
          <text>记录详情</text>
          <text class="stealth-sheet-meta">{{ loading ? "同步中" : feedback || "只读" }}</text>
        </view>
        <text v-if="loading" class="stealth-status-row">同步中</text>
        <text v-else-if="feedback || !post" class="stealth-status-row">数据读取失败</text>
        <template v-else>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">标题</text>
            <text class="stealth-cell">{{ post.title }}</text>
            <text class="stealth-cell stealth-cell-time">公开</text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">分区</text>
            <text class="stealth-cell">{{ sectionLabel }}</text>
            <text class="stealth-cell stealth-cell-time">
              {{ formatDisplayTime(post.createdAt) }}
            </text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">互动统计</text>
            <text class="stealth-cell">
              标记 {{ post.stats.likeCount }} | 评论 {{ post.stats.commentCount }} | 归档
              {{ post.stats.favoriteCount }}
            </text>
            <text class="stealth-cell stealth-cell-time">统计</text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">附件数量</text>
            <text class="stealth-cell">{{ attachmentCount }}</text>
            <view class="stealth-cell stealth-cell-action">
              <text class="stealth-text-button" @tap="toggleAttachmentList">查看</text>
            </view>
          </view>
        </template>
      </view>

      <view v-if="post" class="stealth-sheet stealth-attachment-table">
        <view class="stealth-sheet-title">
          <text>操作</text>
          <text class="stealth-sheet-meta">即时更新</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell">
            标记状态：{{ post.viewerInteraction?.liked ? "已标记" : "未标记" }}
          </text>
          <view class="stealth-cell stealth-cell-action">
            <text
              :class="[
                'stealth-text-button',
                post.viewerInteraction?.liked ? 'stealth-text-button-active' : ''
              ]"
              @tap="toggleMark"
            >
              标记
            </text>
          </view>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell">
            归档状态：{{ post.viewerInteraction?.favorited ? "已归档" : "未归档" }}
          </text>
          <view class="stealth-cell stealth-cell-action">
            <text
              :class="[
                'stealth-text-button',
                post.viewerInteraction?.favorited ? 'stealth-text-button-active' : ''
              ]"
              @tap="toggleArchive"
            >
              归档
            </text>
          </view>
        </view>
      </view>

      <view v-if="post" class="stealth-sheet">
        <view class="stealth-sheet-title">
          <text>正文</text>
          <text class="stealth-sheet-meta">合并单元格</text>
        </view>
        <text class="stealth-merged-cell">{{ post.body }}</text>
      </view>

      <view v-if="post && attachmentListVisible" class="stealth-sheet stealth-attachment-table">
        <view class="stealth-sheet-title">
          <text>附件清单</text>
          <text class="stealth-sheet-meta">{{ attachmentCount }} 项</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">附件</text>
          <text class="stealth-cell stealth-cell-action">操作</text>
        </view>
        <text v-if="attachmentCount === 0" class="stealth-status-row">暂无记录</text>
        <view v-for="(asset, index) in post.mediaAssets" v-else :key="asset.id" class="stealth-row">
          <text class="stealth-cell">附件 {{ index + 1 }}</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap="openAttachment(asset)">查看</text>
          </view>
        </view>
      </view>

      <view v-if="post" class="stealth-sheet stealth-comment-table">
        <view class="stealth-sheet-title">
          <text>发表评论</text>
          <text class="stealth-sheet-meta">{{ commentSubmitting ? "同步中" : "可编辑" }}</text>
        </view>
        <view class="stealth-comment-input-row">
          <textarea
            v-model="commentBody"
            class="stealth-comment-input"
            maxlength="500"
            placeholder="填写评论内容"
            :disabled="commentSubmitting"
            :auto-height="true"
            confirm-type="send"
          />
        </view>
        <view class="stealth-comment-action-row">
          <text class="stealth-cell">{{ commentFeedback || " " }}</text>
          <view class="stealth-cell stealth-cell-action">
            <text
              :class="[
                'stealth-text-button',
                commentSubmitting ? 'stealth-text-button-active' : ''
              ]"
              @tap="submitComment"
            >
              发表评论
            </text>
          </view>
        </view>

        <view class="stealth-sheet-title">
          <text>评论记录</text>
          <text class="stealth-sheet-meta">{{ commentRows.length }} 条</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">人员</text>
          <text class="stealth-cell">内容</text>
          <text class="stealth-cell stealth-cell-time">时间</text>
        </view>
        <text v-if="commentRows.length === 0" class="stealth-status-row">暂无记录</text>
        <view v-for="row in commentRows" v-else :key="row.id" class="stealth-row">
          <text class="stealth-cell">{{ row.person }}</text>
          <text class="stealth-cell">
            <text class="stealth-title-two-line">{{ row.level }} | {{ row.body }}</text>
          </text>
          <text class="stealth-cell stealth-cell-time">{{ formatDisplayTime(row.createdAt) }}</text>
        </view>
      </view>
    </view>

    <view v-if="currentImageUrl" class="stealth-image-viewer" @tap="closeImageViewer">
      <image class="stealth-image-viewer-image" :src="currentImageUrl" mode="aspectFit" />
    </view>
  </view>
</template>

<style>
@import "./stealth-table.css";
</style>
