<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ACTION_LIMIT_AD_REWARD_USES } from '~/constants/pet'
import type {
  PetAction,
  PetActionLimitInfo,
  PetActionLimitRewardFeedback,
  PetCareFeedback,
  PetCareRecommendation,
  PetStats,
} from '~/types/pet'
import type { CareActionRewardPreview } from '~/utils/petCare'
import type { ProgressInfo } from '~/utils/petGrowth'

const props = defineProps<{
  stats: PetStats
  lastPlayedAt: number
  cooldowns: Record<PetAction, number>
  activeReaction: PetAction | null
  actionLimitInfo: PetActionLimitInfo
  careFeedback: PetCareFeedback | null
  actionLimitRewardFeedback: PetActionLimitRewardFeedback | null
  recommendedCareAction: PetCareRecommendation | null
  recommendedCareRewardPreview?: CareActionRewardPreview | null
  levelProgress?: ProgressInfo | null
}>()

const emit = defineEmits<{
  action: [action: PetAction]
  rewardAd: []
}>()
const { messages } = useLocale()
const now = ref(Date.now())

let cooldownTimer: number | null = null

const actions: Array<{
  id: PetAction
}> = [
  {
    id: 'feed',
  },
  {
    id: 'play',
  },
  {
    id: 'sleep',
  },
  {
    id: 'wash',
  },
]

type ActionButtonState = 'ready' | 'recommended' | 'cooldown' | 'active' | 'locked'

const hasActionLimitWindowExpired = computed(() => props.actionLimitInfo.resetAt <= now.value)
const isLimitReached = computed(
  () => !hasActionLimitWindowExpired.value && props.actionLimitInfo.remaining <= 0,
)
const feedbackStatRows = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return []

  return (['fullness', 'energy', 'cleanliness'] as const)
    .map((key) => ({
      key,
      label: messages.value.stats[key],
      value: feedback.statChanges[key],
    }))
    .filter((stat) => stat.value !== 0)
})
const careFeedbackSummary = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return ''

  if (feedback.action === 'play' && feedback.gainedAffinityExp > 0) {
    return messages.value.careFeedback.affinitySummary
      .replace('{stat}', messages.value.stats.affinity)
      .replace('{value}', formatSigned(feedback.gainedAffinityExp))
  }

  const strongestStat = [...feedbackStatRows.value]
    .filter((stat) => stat.value > 0)
    .sort((current, next) => next.value - current.value)[0]

  if (strongestStat) {
    return messages.value.careFeedback.statSummary
      .replace('{stat}', strongestStat.label)
      .replace('{value}', formatSigned(strongestStat.value))
  }

  return messages.value.careFeedback.expSummary.replace('{value}', formatSigned(feedback.gainedExp))
})
const shouldShowFeedbackGrowth = computed(() => Boolean(props.careFeedback && props.levelProgress))
const feedbackGrowthCurrent = computed(() => props.levelProgress?.current ?? 0)
const feedbackGrowthRequired = computed(() => props.levelProgress?.required ?? 0)
const feedbackGrowthRemaining = computed(() =>
  Math.max(0, feedbackGrowthRequired.value - feedbackGrowthCurrent.value),
)
const feedbackGrowthPercent = computed(() =>
  Math.min(100, Math.max(0, props.levelProgress?.percent ?? 0)),
)
const feedbackGrowthTitle = computed(() => {
  const feedback = props.careFeedback
  if (!feedback || !props.levelProgress) return ''

  if (feedback.didLevelUp) return messages.value.careFeedback.growthComplete

  return messages.value.careFeedback.growthRemaining
    .replace('{remaining}', String(feedbackGrowthRemaining.value))
    .replace('{exp}', messages.value.stats.exp)
})
const feedbackGrowthDetail = computed(() => {
  const feedback = props.careFeedback
  if (!feedback || !props.levelProgress) return ''

  const template = feedback.didLevelUp
    ? messages.value.careFeedback.growthCompleteDetail
    : messages.value.careFeedback.growthDetail

  return template
    .replace('{current}', String(feedbackGrowthCurrent.value))
    .replace('{required}', String(feedbackGrowthRequired.value))
    .replace('{exp}', messages.value.stats.exp)
})
const careFeedbackTitle = computed(() => {
  const feedback = props.careFeedback
  if (!feedback) return ''

  return messages.value.careFeedback.title.replace(
    '{action}',
    messages.value.actions[feedback.action].label,
  )
})
const activeReactionTitle = computed(() => {
  if (!props.activeReaction) return ''

  return messages.value.careProgress.title.replace(
    '{action}',
    messages.value.actions[props.activeReaction].label,
  )
})
const activeReactionDetail = computed(() => {
  if (!props.activeReaction) return ''

  return messages.value.careProgress.detail
})
const recommendationTitle = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careRecommendation.title.replace(
    '{action}',
    messages.value.actions[recommendation.action].label,
  )
})
const recommendationDetail = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careRecommendation.details[recommendation.action]
})
const feedbackNextActionTitle = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careFeedback.nextTitle.replace(
    '{action}',
    messages.value.actions[recommendation.action].label,
  )
})
const feedbackNextActionDetail = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  return messages.value.careRecommendation.details[recommendation.action]
})
const actionLimitText = computed(() => {
  const limitMessages = messages.value.actionLimit

  if (hasActionLimitWindowExpired.value) {
    return limitMessages.resetReady
  }

  if (isLimitReached.value) {
    return limitMessages.locked.replace(
      '{time}',
      formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
    )
  }

  return limitMessages.remaining
    .replace('{remaining}', String(props.actionLimitInfo.remaining))
    .replace('{limit}', String(props.actionLimitInfo.limit))
})
const actionLimitMetaText = computed(() => {
  if (hasActionLimitWindowExpired.value) return messages.value.actionLimit.resetReadyHint
  if (isLimitReached.value) return messages.value.actionLimit.rewardHint

  return messages.value.actionLimit.resetHint.replace(
    '{time}',
    formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
  )
})
const actionLimitRewardText = computed(() => {
  const feedback = props.actionLimitRewardFeedback
  if (!feedback) return ''

  return messages.value.actionLimit.rewardGranted.replace('{count}', String(feedback.addedUses))
})
const actionLimitRecoveryWaitText = computed(() =>
  messages.value.actionLimit.waitDetail.replace(
    '{time}',
    formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
  ),
)
const actionLimitRecoveryRewardText = computed(() =>
  messages.value.actionLimit.rewardDetail.replace(
    '{count}',
    String(ACTION_LIMIT_AD_REWARD_USES),
  ),
)
const nextCoolingAction = computed(() =>
  actions
    .map(({ id }) => ({
      id,
      remaining: props.cooldowns[id] - now.value,
    }))
    .filter((action) => action.remaining > 0)
    .sort((current, next) => current.remaining - next.remaining)[0] ?? null,
)
const shouldShowRecommendation = computed(
  () => Boolean(
    props.recommendedCareAction &&
    !isLimitReached.value &&
    !props.activeReaction &&
    !props.careFeedback,
  ),
)
const recommendedActionCooldownRemaining = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return 0

  return Math.max(0, props.cooldowns[recommendation.action] - now.value)
})
const recommendationCtaStatus = computed(() =>
  recommendedActionCooldownRemaining.value > 0 ? 'cooldown' : 'ready',
)
const recommendationCtaStatusText = computed(() => {
  if (!shouldShowRecommendation.value) return ''

  if (recommendationCtaStatus.value === 'cooldown') {
    return messages.value.careRecommendation.ctaCooldown.replace(
      '{time}',
      formatRemainingTime(recommendedActionCooldownRemaining.value),
    )
  }

  return messages.value.careRecommendation.ctaReady
})
const recommendationCtaStatusClass = computed(() =>
  `action-recommendation__cta--${recommendationCtaStatus.value}`,
)
const nextAvailabilityCoolingAction = computed(() => {
  const coolingAction = nextCoolingAction.value
  if (!coolingAction) return null

  const recommendedCooldownAction =
    shouldShowRecommendation.value && recommendationCtaStatus.value === 'cooldown'
      ? props.recommendedCareAction?.action
      : null

  if (coolingAction.id === recommendedCooldownAction) return null

  return coolingAction
})
const actionAvailabilityText = computed(() => {
  if (isLimitReached.value || props.activeReaction) return ''

  const coolingAction = nextAvailabilityCoolingAction.value
  if (!coolingAction) return ''

  return messages.value.actionAvailability.cooldown
    .replace('{action}', messages.value.actions[coolingAction.id].label)
    .replace('{time}', formatRemainingTime(coolingAction.remaining))
})
const shouldShowActionAvailability = computed(() => Boolean(actionAvailabilityText.value))
const recommendationEvidenceText = computed(() => {
  const recommendation = props.recommendedCareAction
  if (!recommendation) return ''

  if (recommendation.action === 'play') {
    return messages.value.careRecommendation.playEvidence.replace(
      '{time}',
      formatElapsedTime(now.value - props.lastPlayedAt),
    )
  }

  if (!recommendation.statKey) return ''

  return messages.value.careRecommendation.statEvidence
    .replace('{stat}', messages.value.stats[recommendation.statKey])
    .replace('{value}', String(props.stats[recommendation.statKey]))
})
const shouldShowRecommendationEvidence = computed(() =>
  Boolean(shouldShowRecommendation.value && recommendationEvidenceText.value),
)
const recommendationRewardText = computed(() => {
  const reward = props.recommendedCareRewardPreview
  if (!reward) return ''

  return messages.value.careRecommendation.rewardHint
    .replace('{exp}', formatSigned(reward.gainedExp))
    .replace('{affinity}', formatSigned(reward.gainedAffinityExp))
})
const recommendationRewardReducedText = computed(() => {
  if (!props.recommendedCareRewardPreview?.wasReduced) return ''

  return messages.value.careRecommendation.rewardReduced
})
const shouldShowRecommendationReward = computed(() =>
  Boolean(shouldShowRecommendation.value && props.recommendedCareRewardPreview),
)
const shouldShowFeedbackNextAction = computed(
  () => {
    const recommendation = props.recommendedCareAction

    return Boolean(
      props.careFeedback &&
      recommendation &&
      !isLimitReached.value &&
      !props.activeReaction &&
      props.cooldowns[recommendation.action] <= now.value,
    )
  },
)
const careFeedbackRetentionTitle = computed(() => {
  if (!props.careFeedback) return ''

  if (hasActionLimitWindowExpired.value) return messages.value.careFeedback.retentionReadyTitle

  if (isLimitReached.value) {
    return messages.value.careFeedback.retentionInTitle.replace(
      '{time}',
      formatRemainingTime(props.actionLimitInfo.resetAt - now.value),
    )
  }

  if (shouldShowFeedbackNextAction.value) return messages.value.careFeedback.retentionNowTitle

  const coolingAction = nextCoolingAction.value
  if (coolingAction) {
    return messages.value.careFeedback.retentionInTitle.replace(
      '{time}',
      formatRemainingTime(coolingAction.remaining),
    )
  }

  return messages.value.careFeedback.retentionLaterTitle
})
const careFeedbackCheckbackText = computed(() => {
  if (!props.careFeedback) return ''

  if (hasActionLimitWindowExpired.value) return messages.value.careFeedback.retentionReadyDetail

  if (isLimitReached.value) return messages.value.careFeedback.retentionLimitDetail

  if (shouldShowFeedbackNextAction.value) return messages.value.careFeedback.retentionNowDetail

  const coolingAction = nextCoolingAction.value
  if (coolingAction) {
    return messages.value.careFeedback.retentionCooldownDetail
      .replace('{action}', messages.value.actions[coolingAction.id].label)
      .replace('{time}', formatRemainingTime(coolingAction.remaining))
  }

  return messages.value.careFeedback.retentionLaterDetail
})
const shouldShowFeedbackCheckback = computed(() => Boolean(careFeedbackCheckbackText.value))
const shouldShowFeedbackFollowup = computed(() =>
  Boolean(
    props.careFeedback &&
    (shouldShowFeedbackNextAction.value ||
      props.careFeedback.wasReduced ||
      shouldShowFeedbackCheckback.value),
  ),
)

onMounted(() => {
  now.value = Date.now()
  cooldownTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 250)
})

onBeforeUnmount(() => {
  if (!cooldownTimer) return

  window.clearInterval(cooldownTimer)
  cooldownTimer = null
})

function isActionDisabled(action: PetAction): boolean {
  return isLimitReached.value || props.cooldowns[action] > now.value || props.activeReaction === action
}

function isRecommendedAction(action: PetAction): boolean {
  return !isLimitReached.value && !props.activeReaction && props.recommendedCareAction?.action === action
}

function getActionButtonState(action: PetAction): ActionButtonState {
  if (isLimitReached.value) return 'locked'
  if (props.activeReaction === action) return 'active'
  if (props.cooldowns[action] > now.value) return 'cooldown'
  if (isRecommendedAction(action)) return 'recommended'

  return 'ready'
}

function getActionButtonStateLabel(action: PetAction): string {
  return messages.value.actionButtonState[getActionButtonState(action)]
}

function getActionButtonStateClass(action: PetAction): string {
  return `action-button__badge--${getActionButtonState(action)}`
}

function getActionDetail(action: PetAction): string {
  if (props.activeReaction === action) return messages.value.actionState.inProgress
  if (isLimitReached.value) return messages.value.actionState.limitReached

  const remainingCooldown = props.cooldowns[action] - now.value
  if (remainingCooldown > 0) {
    return messages.value.actionState.cooldown.replace(
      '{time}',
      formatRemainingTime(remainingCooldown),
    )
  }

  return messages.value.actions[action].detail
}

function getActionButtonDetail(action: PetAction): string {
  if (getActionButtonState(action) === 'recommended') {
    return messages.value.actionButtonState.recommendedDetail
  }

  return getActionDetail(action)
}

function getActionAriaLabel(action: PetAction): string {
  return messages.value.actionState.ariaLabel
    .replace('{action}', messages.value.actions[action].label)
    .replace('{state}', `${getActionButtonStateLabel(action)} · ${getActionButtonDetail(action)}`)
}

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) return `${seconds}s`

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function formatElapsedTime(milliseconds: number): string {
  const elapsedMilliseconds = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0
  const totalMinutes = Math.max(1, Math.floor(elapsedMilliseconds / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) return messages.value.time.minutesAgo.replace('{minutes}', String(minutes))
  if (minutes <= 0) return messages.value.time.hoursAgo.replace('{hours}', String(hours))

  return messages.value.time.hoursMinutesAgo
    .replace('{hours}', String(hours))
    .replace('{minutes}', String(minutes))
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`

  return String(value)
}
</script>

<template>
  <div class="action-section">
    <div class="action-limit" :class="{ 'action-limit--locked': isLimitReached }">
      <div class="action-limit__copy">
        <span>{{ actionLimitText }}</span>
        <small>{{ actionLimitMetaText }}</small>
      </div>
      <div
        v-if="isLimitReached"
        class="action-limit__recovery"
        role="group"
        :aria-label="messages.actionLimit.recoveryLabel"
      >
        <span class="action-limit__option action-limit__option--wait">
          <strong>{{ messages.actionLimit.waitOption }}</strong>
          <small>{{ actionLimitRecoveryWaitText }}</small>
        </span>
        <button
          class="action-limit__option action-limit__option--reward"
          type="button"
          @click="emit('rewardAd')"
        >
          <strong>{{ messages.actionLimit.rewardOption }}</strong>
          <small>{{ actionLimitRecoveryRewardText }}</small>
        </button>
      </div>
    </div>

    <div v-if="actionLimitRewardFeedback" class="action-limit-reward" role="status">
      {{ actionLimitRewardText }}
    </div>

    <div v-if="activeReaction" class="care-progress" role="status">
      <div>
        <span>{{ messages.careProgress.heading }}</span>
        <strong>{{ activeReactionTitle }}</strong>
      </div>
      <small>{{ activeReactionDetail }}</small>
      <span class="care-progress__bar" aria-hidden="true" />
    </div>

    <div
      v-if="shouldShowRecommendation"
      class="action-recommendation"
      aria-live="polite"
    >
      <div>
        <span>{{ messages.careRecommendation.heading }}</span>
        <strong>{{ recommendationTitle }}</strong>
      </div>
      <div class="action-recommendation__support">
        <small>{{ recommendationDetail }}</small>
        <span
          v-if="recommendationCtaStatusText"
          class="action-recommendation__cta"
          :class="recommendationCtaStatusClass"
        >
          {{ recommendationCtaStatusText }}
        </span>
        <span v-if="shouldShowRecommendationEvidence" class="action-recommendation__evidence">
          {{ recommendationEvidenceText }}
        </span>
        <span v-if="shouldShowRecommendationReward" class="action-recommendation__reward">
          {{ recommendationRewardText }}
        </span>
        <span
          v-if="recommendationRewardReducedText"
          class="action-recommendation__reward action-recommendation__reward--muted"
        >
          {{ recommendationRewardReducedText }}
        </span>
      </div>
    </div>

    <div v-if="shouldShowActionAvailability" class="action-availability" aria-live="polite">
      {{ actionAvailabilityText }}
    </div>

    <div class="action-panel">
      <button
        v-for="action in actions"
        :key="action.id"
        class="action-button"
        :class="{ 'action-button--recommended': getActionButtonState(action.id) === 'recommended' }"
        type="button"
        :disabled="isActionDisabled(action.id)"
        :aria-label="getActionAriaLabel(action.id)"
        @click="emit('action', action.id)"
      >
        <span class="action-button__label">
          <span>{{ messages.actions[action.id].label }}</span>
          <em class="action-button__badge" :class="getActionButtonStateClass(action.id)">
            {{ getActionButtonStateLabel(action.id) }}
          </em>
        </span>
        <small>{{ getActionButtonDetail(action.id) }}</small>
      </button>
    </div>

    <div v-if="careFeedback" class="care-feedback" aria-live="polite">
      <div class="care-feedback__header">
        <span>{{ careFeedbackTitle }}</span>
        <strong>+{{ careFeedback.gainedExp }} {{ messages.stats.exp }}</strong>
      </div>

      <div class="care-feedback__overview">
        <div class="care-feedback__summary">
          <span>{{ messages.careFeedback.summaryLabel }}</span>
          <strong>{{ careFeedbackSummary }}</strong>
        </div>

        <div v-if="shouldShowFeedbackGrowth" class="care-feedback__growth">
          <span>{{ messages.careFeedback.growthLabel }}</span>
          <div>
            <strong>{{ feedbackGrowthTitle }}</strong>
            <small>{{ feedbackGrowthDetail }}</small>
            <div
              class="care-feedback__growth-track"
              role="progressbar"
              :aria-label="messages.careFeedback.growthLabel"
              :aria-valuemin="0"
              :aria-valuenow="feedbackGrowthCurrent"
              :aria-valuemax="feedbackGrowthRequired"
            >
              <span
                class="care-feedback__growth-fill"
                :style="{ width: `${feedbackGrowthPercent}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="care-feedback__chips" :aria-label="messages.careFeedback.ariaLabel">
        <span
          v-for="stat in feedbackStatRows"
          :key="stat.key"
          class="care-feedback__chip"
          :class="{ 'care-feedback__chip--negative': stat.value < 0 }"
        >
          {{ stat.label }} {{ formatSigned(stat.value) }}
        </span>
        <span v-if="careFeedback.gainedAffinityExp > 0" class="care-feedback__chip">
          {{ messages.stats.affinity }} +{{ careFeedback.gainedAffinityExp }}
        </span>
        <span v-if="careFeedback.didLevelUp" class="care-feedback__chip care-feedback__chip--strong">
          {{ messages.careFeedback.levelUp }}
        </span>
        <span
          v-if="careFeedback.didAffinityLevelUp"
          class="care-feedback__chip care-feedback__chip--strong"
        >
          {{ messages.careFeedback.affinityUp }}
        </span>
      </div>

      <div v-if="shouldShowFeedbackFollowup" class="care-feedback__follow-up">
        <div v-if="shouldShowFeedbackNextAction" class="care-feedback__next">
          <span>{{ messages.careFeedback.nextLabel }}</span>
          <div>
            <strong>{{ feedbackNextActionTitle }}</strong>
            <small>{{ feedbackNextActionDetail }}</small>
          </div>
        </div>

        <div v-if="shouldShowFeedbackCheckback" class="care-feedback__checkback">
          <span>{{ messages.careFeedback.checkbackLabel }}</span>
          <div>
            <strong>{{ careFeedbackRetentionTitle }}</strong>
            <small>{{ careFeedbackCheckbackText }}</small>
          </div>
        </div>

        <p v-if="careFeedback.wasReduced" class="care-feedback__note">
          {{ messages.careFeedback.reduced }}
        </p>
      </div>
    </div>
  </div>
</template>
