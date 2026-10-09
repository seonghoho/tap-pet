<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PET_OUTFITS, PREMIUM_TITLE_IDS, SHOP_PRODUCT_IDS, SHOP_PRODUCTS, type ShopProductId } from '~/constants/shop'
import { getDisguiseTitleLabel } from '~/constants/titles'
import type { PetSpecies } from '~/types/pet'

const props = defineProps<{
  species: PetSpecies
  source: 'growth' | 'settings'
}>()

const { locale, messages } = useLocale()
const shop = useEntitlements()
const purchases = usePurchases()
const restoreOrderId = ref('')
const restoreNotice = ref('')
const isRestoring = ref(false)

const products = computed(() =>
  SHOP_PRODUCT_IDS.map((id) => {
    const owned = shop.entitlements.value.find((entitlement) => entitlement.productId === id)

    return {
      id,
      copy: messages.value.shop.products[id],
      price: SHOP_PRODUCTS[id].price,
      orderId: owned?.orderId ?? null,
    }
  }),
)

onMounted(() => trackEvent('shop_viewed', { source: props.source }))

function formatPrice(price: number): string {
  return new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : locale.value, {
    style: 'currency',
    currency: 'KRW',
  }).format(price)
}

function buttonLabel(id: ShopProductId, price: number): string {
  if (!purchases.isEnabled.value) return messages.value.shop.comingSoon
  if (purchases.pendingProduct.value === id) return messages.value.shop.opening

  return messages.value.shop.buy.replace('{price}', formatPrice(price))
}

function buy(id: ShopProductId): void {
  void purchases.buy(id, messages.value.shop.products[id].name)
}

async function restore(): Promise<void> {
  if (!restoreOrderId.value.trim() || isRestoring.value) return

  isRestoring.value = true
  const ok = await purchases.restore(restoreOrderId.value)
  isRestoring.value = false
  restoreNotice.value = ok ? messages.value.shop.restored : messages.value.shop.restoreFailed
  if (ok) restoreOrderId.value = ''
}
</script>

<template>
  <section id="tab-pet-shop" class="shop-panel" aria-labelledby="shop-heading">
    <div class="shop-panel__header">
      <strong id="shop-heading">{{ messages.shop.heading }}</strong>
      <small>{{ messages.shop.description }}</small>
    </div>

    <article
      v-for="product in products"
      :key="product.id"
      class="shop-product"
      :class="{ 'shop-product--owned': product.orderId }"
    >
      <div v-if="product.id === 'outfit-pack'" class="shop-product__preview" aria-hidden="true">
        <PetAvatar
          v-for="outfit in PET_OUTFITS"
          :key="outfit"
          :species="species"
          status="happy"
          :outfit="outfit"
          compact
        />
      </div>
      <div v-else class="shop-product__titles" aria-hidden="true">
        <span v-for="titleId in PREMIUM_TITLE_IDS" :key="titleId">
          {{ getDisguiseTitleLabel(titleId, locale) }}
        </span>
      </div>

      <div class="shop-product__copy">
        <strong>{{ product.copy.name }}</strong>
        <small>{{ product.copy.detail }}</small>
      </div>

      <p v-if="product.orderId" class="shop-product__owned">
        <span>{{ messages.shop.owned }}</span>
        <small>{{ messages.shop.orderNumber.replace('{orderId}', product.orderId) }}</small>
      </p>
      <button
        v-else
        class="shop-product__buy"
        type="button"
        :disabled="!purchases.isEnabled.value || purchases.pendingProduct.value !== null"
        @click="buy(product.id)"
      >
        {{ buttonLabel(product.id, product.price) }}
      </button>
    </article>

    <details v-if="purchases.isEnabled.value" class="shop-restore">
      <summary>{{ messages.shop.restoreTitle }}</summary>
      <small>{{ messages.shop.restoreHint }}</small>
      <form class="shop-restore__form" @submit.prevent="restore">
        <input
          v-model="restoreOrderId"
          class="settings-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="messages.shop.restorePlaceholder"
          :aria-label="messages.shop.restorePlaceholder"
        >
        <button class="ghost-button" type="submit" :disabled="isRestoring || !restoreOrderId.trim()">
          {{ messages.shop.restoreButton }}
        </button>
      </form>
      <small v-if="restoreNotice" class="settings-notice" role="status">{{ restoreNotice }}</small>
    </details>
  </section>
</template>
