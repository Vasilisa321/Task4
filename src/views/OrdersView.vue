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

