<template>
  <input v-model.number="value" type="number" :name :min :max :step>
</template>

<script lang="ts" setup>
defineProps({
  name: { type: String, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
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
