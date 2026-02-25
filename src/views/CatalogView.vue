<template>
  <div class="catalog">
    <h1>Каталог товаров</h1>

    <div v-if="loading" class="loading">
      Загрузка товаров...
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="!loading && products.length > 0" class="products">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h3>{{ product.name }}</h3>
        <p>Цена: {{ product.price }} ₽</p>
        <button
            v-if="isAuthenticated"
            @click="addToCart(product.id)"
            :disabled="cartLoading"
        >
          {{ cartLoading ? 'Добавление...' : 'В корзину' }}
        </button>
      </div>
    </div>

    <div v-if="!loading && products.length === 0" class="empty">
      Товаров пока нет
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CatalogView',
  setup() {
    const store = useStore()
    const cartLoading = ref(false)

    const products = computed(() => store.state.products || [])
    const loading = computed(() => store.state.loading)
    const error = computed(() => store.state.error)
    const isAuthenticated = computed(() => store.getters.isAuthenticated)

    onMounted(() => {
      store.dispatch('fetchProducts')
    })

    const addToCart = async (productId) => {
      cartLoading.value = true
      try {
        await store.dispatch('addToCart', productId)
        alert('Товар добавлен в корзину!')
      } catch (error) {
        alert('Ошибка при добавлении в корзину')
      } finally {
        cartLoading.value = false
      }
    }

    return {
      products,
      loading,
      error,
      isAuthenticated,
      cartLoading,
      addToCart
    }
  }
}
</script>

<style scoped>
.catalog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.product-card p {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin: 10px 0;
}

.product-card button {
  background-color: #2c3e50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.product-card button:hover {
  background-color: #34495e;
}

.product-card button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: red;
}
</style>