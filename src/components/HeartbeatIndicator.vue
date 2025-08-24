<template>
  <div class="heartbeat-indicator">
    <span v-if="visible">❤️</span>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  pulseLength: { type: Number, default: 500 },
})

const visible = ref(false)

defineExpose({
  ping() {
    visible.value = true
    setTimeout(() => { visible.value = false }, props.pulseLength)
  },
})
</script>
