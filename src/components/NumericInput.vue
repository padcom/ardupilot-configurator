<template>
  <input v-model.number="value" :name>
</template>

<script lang="ts" setup>
defineProps({
  name: { type: String, required: true },
})

const value = defineModel<number>()
</script>

<style lang="postcss" scoped>
input {
  width: 100%;
  border: none;
  outline: none;
  padding: 10px 10px 12px 14px;
  border-radius: 5px;
  color: #35495e;
}
</style>
