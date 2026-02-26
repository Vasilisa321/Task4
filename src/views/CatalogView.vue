<template>
  <div class="catalog">
    <h1>Каталог товаров</h1>

    <div v-if="loading">Загрузка...</div>
    <div v-else>
      <div v-for="product in products" :key="product.id" class="product">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p>Price: {{ product.price }}</p>
        <button @click="addToCart(product.id)">Add to cart</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState(['products', 'loading'])
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    ...mapActions(['fetchProducts', 'addToCart'])
  }
};
</script>

<style scoped>
.catalog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.product {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
}
</style>