<template>
  <div class="catalog">
    <h1 class="catalog-title">Каталог товаров</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">Загрузка товаров...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Ошибка загрузки</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchProducts" class="retry-btn">
        Повторить попытку
      </button>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>Товары временно отсутствуют</h3>
      <p>Пожалуйста, зайдите позже</p>
    </div>

    <div v-else class="products-grid">
      <transition-group name="product" tag="div" class="products-grid-inner">
        <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
        >
          <div class="product-image">
            <div class="image-placeholder">
              <span>🛍️</span>
            </div>
          </div>

          <div class="product-content">
            <h3 class="product-title">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>
            <div class="product-price">
              {{ formatPrice(product.price) }}
            </div>
          </div>

          <button
              v-if="isAuthenticated"
              @click="handleAddToCart(product.id)"
              class="add-to-cart-btn"
              :disabled="isAddingToCart(product.id)"
              :class="{ 'adding': isAddingToCart(product.id) }"
          >
            <span class="btn-icon" v-if="!isAddingToCart(product.id)"></span>
            <span class="btn-icon" v-else>⏳</span>
            {{ getButtonText(product.id) }}
          </button>

          <div v-else class="login-prompt">
            <router-link to="/login" class="login-prompt-link">
              Войдите, чтобы купить
            </router-link>
          </div>
        </div>
      </transition-group>
    </div>

    <transition name="slide-fade">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <span class="notification-icon">{{ notification.icon }}</span>
        <span class="notification-message">{{ notification.message }}</span>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="globalAdding" class="global-adding-overlay">
        <div class="global-adding-content">
          <div class="spinner"></div>
          <p>Добавление в корзину...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'CatalogView',

  data() {
    return {
      addingProducts: new Set(),
      notification: {
        show: false,
        type: 'success',
        icon: '✓',
        message: ''
      },
      notificationTimeout: null
    };
  },

  computed: {
    ...mapState({
      products: state => state.products,
      loading: state => state.loading,
      error: state => state.error
    }),
    ...mapGetters(['isAuthenticated']),

    globalAdding() {
      return this.addingProducts.size > 0;
    }
  },

  created() {
    this.loadProducts();
  },

  beforeDestroy() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  },

  methods: {
    ...mapActions(['fetchProducts', 'addToCart']),

    async loadProducts() {
      try {
        await this.fetchProducts();
      } catch (error) {
        console.error('Error loading products:', error);
        this.showNotification('error', '✗', 'Ошибка при загрузке товаров');
      }
    },

    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    },

    isAddingToCart(productId) {
      return this.addingProducts.has(productId);
    },

    getButtonText(productId) {
      return this.isAddingToCart(productId) ? 'Добавление...' : 'В корзину';
    },

    async handleAddToCart(productId) {
      if (this.isAddingToCart(productId)) return;

      this.addingProducts.add(productId);

      try {
        await this.addToCart(productId);
        this.showNotification('success', '✓', 'Товар добавлен в корзину');
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showNotification('error', '✗', error.message || 'Ошибка при добавлении в корзину');
      } finally {
        this.addingProducts.delete(productId);
      }
    },

    showNotification(type, icon, message) {
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }

      this.notification = {
        show: true,
        type,
        icon,
        message
      };

      this.notificationTimeout = setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    }
  }
};
</script>

