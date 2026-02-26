<template>
  <div class="cart">
    <div v-if="cart.length > 0" class="cart-header">
      <h1 class="cart-title">Корзина</h1>
      <button @click="goBack" class="back-btn">
        ← Назад
      </button>
    </div>

    <h1 v-else class="cart-title">Корзина</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка корзины...</p>
    </div>

    <div v-else-if="cart.length === 0" class="empty-cart">
      <div class="empty-cart-icon">🛒</div>
      <h2>Корзина пуста</h2>
      <p>Добавьте товары из каталога, чтобы оформить заказ</p>
      <button @click="goBack" class="back-btn empty-cart-btn">
        Назад
      </button>
    </div>

    <!-- Непустая корзина -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div
            v-for="item in groupedCartItems"
            :key="item.product_id"
            class="cart-item"
        >
          <div class="item-image">
            <div class="image-placeholder">
              <span>🖼️</span>
            </div>
          </div>

          <div class="item-details">
            <h3 class="item-title">{{ item.name }}</h3>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-price">{{ formatPrice(item.price) }} ₽</div>
          </div>

          <div class="item-controls">
            <div class="quantity-controls">
              <button
                  @click="decreaseQuantity(item)"
                  class="quantity-btn"
                  :disabled="isUpdating"
              >
                −
              </button>
              <span class="quantity">{{ item.quantity }}</span>
              <button
                  @click="increaseQuantity(item)"
                  class="quantity-btn"
                  :disabled="isUpdating"
              >
                +
              </button>
            </div>

            <button
                @click="confirmRemoveItem(item)"
                class="remove-btn"
                :disabled="isUpdating"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <h3>Итого</h3>

        <div class="summary-row">
          <span>Товаров:</span>
          <span>{{ totalItems }} шт.</span>
        </div>

        <div class="summary-row">
          <span>Сумма:</span>
          <span>{{ formatPrice(cartTotal) }} ₽</span>
        </div>

        <div class="summary-total">
          <span>К оплате:</span>
          <span class="total-price">{{ formatPrice(cartTotal) }} ₽</span>
        </div>

        <button
            @click="checkout"
            class="checkout-btn"
            :disabled="isUpdating || processingCheckout"
        >
          <span v-if="!processingCheckout">Оформить заказ</span>
          <span v-else class="processing-text">
            <span class="spinner-small"></span>
            Оформление...
          </span>
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </div>

    <div v-if="showRemoveModal" class="modal-overlay" @click="closeRemoveModal">
      <div class="modal-content" @click.stop>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить товар "{{ itemToRemove?.name }}" из корзины?</p>
        <div class="modal-actions">
          <button @click="removeItem" class="confirm-btn">
            Удалить
          </button>
          <button @click="closeRemoveModal" class="cancel-btn">
            Отмена
          </button>
        </div>
      </div>
    </div>

    <div v-if="notification.show" class="notification" :class="notification.type">
      <span class="notification-icon">{{ notification.icon }}</span>
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'CartView',

  data() {
    return {
      isUpdating: false,
      processingCheckout: false,
      showRemoveModal: false,
      itemToRemove: null,
      notification: {
        show: false,
        type: 'success',
        icon: '✓',
        message: ''
      }
    };
  },

  computed: {
    ...mapState({
      cart: state => state.cart,
      loading: state => state.loading,
      error: state => state.error
    }),

    groupedCartItems() {
      const grouped = {};

      this.cart.forEach(item => {
        const key = item.product_id;
        if (!grouped[key]) {
          grouped[key] = {
            ...item,
            quantity: 1,
            cartItemIds: [item.id]
          };
        } else {
          grouped[key].quantity++;
          grouped[key].cartItemIds.push(item.id);
        }
      });

      return Object.values(grouped);
    },

    totalItems() {
      return this.groupedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    },

    cartTotal() {
      return this.groupedCartItems.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
      );
    }
  },

  created() {
    this.loadCart();
  },

  methods: {
    ...mapActions(['fetchCart', 'addToCart', 'removeFromCart', 'checkout']),

    async loadCart() {
      try {
        await this.fetchCart();
      } catch (error) {
        this.showNotification('error', '✗', 'Ошибка при загрузке корзины');
      }
    },

    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    },

    async increaseQuantity(item) {
      if (this.isUpdating) return;

      this.isUpdating = true;
      try {
        await this.addToCart(item.product_id);
        this.showNotification('success', '✓', 'Количество увеличено');
      } catch (error) {
        this.showNotification('error', '✗', 'Ошибка при изменении количества');
      } finally {
        this.isUpdating = false;
      }
    },

    async decreaseQuantity(item) {
      if (this.isUpdating || item.quantity <= 1) return;

      this.isUpdating = true;
      try {
        const cartItemId = item.cartItemIds[item.cartItemIds.length - 1];
        await this.removeFromCart(cartItemId);
        this.showNotification('success', '✓', 'Количество уменьшено');
      } catch (error) {
        this.showNotification('error', '✗', 'Ошибка при изменении количества');
      } finally {
        this.isUpdating = false;
      }
    },

    confirmRemoveItem(item) {
      this.itemToRemove = item;
      this.showRemoveModal = true;
    },

    async removeItem() {
      if (!this.itemToRemove || this.isUpdating) return;

      this.isUpdating = true;
      this.showRemoveModal = false;

      try {
        for (const cartItemId of this.itemToRemove.cartItemIds) {
          await this.removeFromCart(cartItemId);
        }
        this.showNotification('success', '✓', 'Товар удален из корзины');
      } catch (error) {
        this.showNotification('error', '✗', 'Ошибка при удалении товара');
      } finally {
        this.isUpdating = false;
        this.itemToRemove = null;
      }
    },

    closeRemoveModal() {
      this.showRemoveModal = false;
      this.itemToRemove = null;
    },

    async checkout() {
      if (this.processingCheckout || this.cart.length === 0) return;

      this.processingCheckout = true;

      try {
        const result = await this.$store.dispatch('checkout');
        this.showNotification('success', '✓', 'Заказ успешно оформлен!');

        setTimeout(() => {
          this.$router.push('/orders');
        }, 1500);
      } catch (error) {
        this.showNotification('error', '✗', error.message || 'Ошибка при оформлении заказа');
      } finally {
        this.processingCheckout = false;
      }
    },

    goBack() {
      this.$router.push('/');
    },

    showNotification(type, icon, message) {
      this.notification = {
        show: true,
        type,
        icon,
        message
      };

      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    }
  }
};
</script>

<style scoped src="@/assets/styles/main.css"></style>