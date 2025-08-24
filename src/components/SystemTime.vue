<template>
  <div class="system-time">
    <template v-if="time !== 0">{{ formatted }}</template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const time = ref(0)
const formatted = computed(() => time.value)

defineExpose({
  update(n: number) {
    time.value = n
  },
})
</script>
