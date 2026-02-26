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
            <span class="btn-icon" v-if="!isAddingToCart(product.id)">🛒</span>
            <span class="btn-icon" v-else>⏳</span>
            {{ getButtonText(product.id) }}
          </button>

          <!-- Для неавторизованных показываем сообщение -->
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

<style scoped>
.catalog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.catalog-title {
  font-size: 2.2rem;
  color: #2c3e50;
  margin-bottom: 40px;
  font-weight: 600;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  animation: fadeIn 0.5s ease;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.error-title {
  color: #e74c3c;
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.error-message {
  color: #7f8c8d;
  margin-bottom: 25px;
}

.retry-btn {
  padding: 12px 35px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.empty-state p {
  color: #7f8c8d;
}

.products-grid {
  margin-top: 30px;
}

.products-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.5s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 4rem;
  transition: transform 0.3s ease;
}

.product-card:hover .image-placeholder {
  transform: scale(1.1);
}

.product-content {
  padding: 20px;
  flex: 1;
}

.product-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-weight: 600;
  line-height: 1.4;
}

.product-description {
  color: #7f8c8d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 15px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #27ae60;
  margin-top: 10px;
}

.add-to-cart-btn {
  margin: 0 20px 20px 20px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.add-to-cart-btn:hover:not(:disabled)::before {
  width: 300px;
  height: 300px;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.add-to-cart-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-to-cart-btn.adding {
  background: #f39c12;
}

.btn-icon {
  font-size: 1.2rem;
}

.login-prompt {
  margin: 0 20px 20px 20px;
  padding: 12px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #3498db;
}

.login-prompt-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.login-prompt-link:hover {
  color: #2980b9;
  text-decoration: underline;
}

.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 25px;
  border-radius: 50px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
  font-weight: 500;
  max-width: 400px;
}

.notification.success {
  background: linear-gradient(135deg, #27ae60 0%, #219a52 100%);
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.notification-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.notification.success .notification-icon {
  color: #27ae60;
}

.notification.error .notification-icon {
  color: #e74c3c;
}

.notification-message {
  flex: 1;
}

.global-adding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.global-adding-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.3s ease;
}

.global-adding-content .spinner {
  width: 60px;
  height: 60px;
  border-width: 5px;
  margin-bottom: 20px;
}

.global-adding-content p {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.product-enter-active,
.product-leave-active {
  transition: all 0.5s ease;
}

.product-enter-from,
.product-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .catalog-title {
    font-size: 1.8rem;
    text-align: center;
  }

  .products-grid-inner {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
    border-radius: 10px;
  }

  .global-adding-content {
    margin: 20px;
    padding: 30px;
  }
}

@media (max-width: 480px) {
  .products-grid-inner {
    grid-template-columns: 1fr;
  }

  .product-card {
    max-width: 100%;
  }

  .global-adding-content {
    padding: 20px;
  }

  .global-adding-content .spinner {
    width: 40px;
    height: 40px;
  }

  .global-adding-content p {
    font-size: 1rem;
  }
}
</style>