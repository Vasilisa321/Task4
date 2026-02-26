<template>
  <div class="cart">
    <h1 class="cart-title">Корзина</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка корзины...</p>
    </div>

    <div v-else-if="cart.length === 0" class="empty-cart">
      <div class="empty-cart-icon">🛒</div>
      <h2>Корзина пуста</h2>
      <p>Добавьте товары из каталога, чтобы оформить заказ</p>
      <router-link to="/" class="continue-shopping-btn">
        Назад
      </router-link>
    </div>

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

    <transition name="modal">
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
    </transition>

    <transition name="slide-fade">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <span class="notification-icon">{{ notification.icon }}</span>
        {{ notification.message }}
      </div>
    </transition>
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

<style scoped>
.cart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.cart-title {
  font-size: 2rem;
  color: #333;
  margin-bottom: 30px;
  font-weight: 500;
}

.loading-state,
.empty-cart {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.empty-cart-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-cart h2 {
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-cart p {
  color: #666;
  margin-bottom: 30px;
}

.continue-shopping-btn {
  display: inline-block;
  padding: 12px 30px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.continue-shopping-btn:hover {
  background-color: #0056b3;
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
}

.cart-items {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.cart-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item:hover {
  background-color: #f9f9f9;
}

.item-image {
  width: 100px;
  height: 100px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.item-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.item-description {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.item-price {
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
}

.item-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  padding: 5px;
  border-radius: 6px;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  font-weight: 600;
  min-width: 30px;
  text-align: center;
  font-size: 1.1rem;
}

.remove-btn {
  padding: 6px 15px;
  background: none;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background-color: #dc3545;
  color: white;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-summary {
  background: #fff;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.cart-summary h3 {
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 1.3rem;
  font-weight: 500;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #666;
  font-size: 1rem;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  color: #333;
  font-weight: 600;
  font-size: 1.2rem;
}

.total-price {
  color: #28a745;
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #218838;
}

.checkout-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.processing-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
  text-align: center;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.modal-content h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.modal-content p {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 10px 25px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #c82333;
}

.cancel-btn {
  padding: 10px 25px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 24px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  animation: slideInRight 0.3s;
  color: white;
}

.notification.success {
  background-color: #28a745;
}

.notification.error {
  background-color: #dc3545;
}

.notification-icon {
  font-size: 1.1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 80px 1fr;
    gap: 15px;
  }

  .item-image {
    width: 80px;
    height: 80px;
  }

  .item-controls {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #f0f0f0;
  }

  .cart-summary {
    position: static;
  }

  .cart-title {
    font-size: 1.8rem;
  }

  .notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .cart-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .item-image {
    margin: 0 auto;
  }

  .item-controls {
    flex-direction: column;
  }

  .modal-actions {
    flex-direction: column;
  }

  .confirm-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>