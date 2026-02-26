<template>
  <div class="orders">
    <div class="orders-header">
      <h1>Мои заказы</h1>
      <button @click="goBack" class="back-btn">
        Назад
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка заказов...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Ошибка запроса</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="loadOrders" class="retry-btn">
        Повторить попытку
      </button>
    </div>

    <div v-else-if="orders.length === 0" class="empty-orders">
      <div class="empty-orders-icon">📦</div>
      <h2>У вас пока нет заказов</h2>
      <p>Перейдите в каталог, чтобы выбрать товары и оформить первый заказ</p>
      <router-link to="/" class="shop-btn">
        Перейти к покупкам
      </router-link>
    </div>

    <div v-else class="orders-list">
      <transition-group name="order" tag="div">
        <div
            v-for="order in sortedOrders"
            :key="order.id"
            class="order-card"
        >
          <div class="order-header">
            <div class="order-info">
              <span class="order-number">Заказ №{{ order.id }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </div>
          </div>

          <div class="order-items">
            <div class="items-header">
              <span>Товары в заказе:</span>
            </div>
            <div
                v-for="(productId, index) in order.products"
                :key="index"
                class="order-item"
            >
              <div class="item-image">
                <div class="image-placeholder">
                  <span>📦</span>
                </div>
              </div>
              <div class="item-details">
                <span class="item-name">Товар #{{ productId }}</span>
                <span class="item-price">{{ getProductPrice(productId) }}</span>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-total">
              <span>Общая стоимость:</span>
              <strong>{{ formatPrice(order.order_price) }}</strong>
            </div>

            <button
                @click="repeatOrder(order)"
                class="repeat-btn"
                :disabled="repeatingOrder === order.id"
            >
              <span v-if="repeatingOrder !== order.id">Повторить заказ</span>
              <span v-else class="repeating-text">
                <span class="spinner-small"></span>
                Добавление...
              </span>
            </button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Уведомление об успешном действии -->
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
  name: 'OrdersView',

  data() {
    return {
      repeatingOrder: null,
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
      orders: state => state.orders,
      products: state => state.products,
      loading: state => state.loading,
      error: state => state.error
    }),

    sortedOrders() {
      return [...this.orders].sort((a, b) => b.id - a.id);
    }
  },

  created() {
    this.loadOrders();
  },

  methods: {
    ...mapActions(['fetchOrders', 'addToCart']),

    async loadOrders() {
      try {
        await this.fetchOrders();
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    },

    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
      }).format(price);
    },

    formatDate(dateString) {
      if (!dateString) return 'Дата не указана';

      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch {
        return 'Дата не указана';
      }
    },

    getProductPrice(productId) {
      const product = this.products.find(p => p.id === productId);
      return product ? this.formatPrice(product.price) : '—';
    },

    getStatusText(status) {
      const statuses = {
        'new': 'Новый',
        'processing': 'В обработке',
        'completed': 'Выполнен',
        'cancelled': 'Отменён',
        'delivered': 'Доставлен'
      };
      return statuses[status] || status || 'Статус неизвестен';
    },

    getStatusClass(status) {
      const classes = {
        'new': 'status-new',
        'processing': 'status-processing',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled',
        'delivered': 'status-delivered'
      };
      return classes[status] || '';
    },

    async repeatOrder(order) {
      if (this.repeatingOrder) return;

      this.repeatingOrder = order.id;

      try {
        for (const productId of order.products) {
          await this.addToCart(productId);
        }

        this.showNotification('success', '✓', 'Товары добавлены в корзину');

        setTimeout(() => {
          if (confirm('Товары добавлены в корзину. Перейти к оформлению?')) {
            this.$router.push('/cart');
          }
        }, 500);
      } catch (error) {
        this.showNotification('error', '✗', 'Ошибка при добавлении товаров');
      } finally {
        this.repeatingOrder = null;
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

<style scoped>
.orders {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.orders-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
  font-weight: 500;
}

.back-btn {
  padding: 8px 16px;
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #e9ecef;
}

.loading-state,
.error-state,
.empty-orders {
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

.error-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.error-title {
  color: #dc3545;
  margin-bottom: 10px;
  font-weight: 500;
}

.error-message {
  color: #666;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 30px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #0056b3;
}

.empty-orders-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-orders h2 {
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-orders p {
  color: #666;
  margin-bottom: 30px;
}

.shop-btn {
  display: inline-block;
  padding: 12px 30px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.shop-btn:hover {
  background-color: #0056b3;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.order-number {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
}

.order-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-new {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-processing {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-completed {
  background-color: #e8f5e8;
  color: #388e3c;
}

.status-delivered {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.order-items {
  padding: 20px;
}

.items-header {
  margin-bottom: 15px;
  color: #333;
  font-weight: 500;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 50px;
  height: 50px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.item-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.item-name {
  color: #333;
}

.item-price {
  color: #28a745;
  font-weight: 600;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 15px;
}

.order-total {
  font-size: 1.1rem;
  color: #333;
}

.order-total strong {
  color: #28a745;
  margin-left: 10px;
  font-size: 1.2rem;
}

.repeat-btn {
  padding: 8px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.repeat-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.repeat-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.repeating-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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

@media (max-width: 768px) {
  .orders-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .order-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .order-info {
    flex-direction: column;
    gap: 5px;
  }

  .order-footer {
    flex-direction: column;
    text-align: center;
  }

  .order-total {
    width: 100%;
  }

  .repeat-btn {
    width: 100%;
  }

  .item-details {
    flex-direction: column;
    align-items: flex-start;
  }

  .notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>