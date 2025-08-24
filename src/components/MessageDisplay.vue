<template>
  <div class="message-display" :class="{
    emergency: severity === 0,
    alert: severity === 1,
    critical: severity === 2,
    error: severity === 3,
    warning: severity === 4,
    notice: severity === 5,
    info: severity === 6,
    debug: severity === 7
  }">
    {{ message }}
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const message = ref('')
const severity = ref(0)

defineExpose({
  show(msg: string, level: number) {
    message.value = msg
    severity.value = level
  },
})
</script>

<style lang="postcss" scoped>
.emergency {
  color: purple;
  font-weight: bolder;
}

.alert {
  color: white;
  background-color: red;
  font-weight: bolder;
}

.critical {
  color: white;
  background-color: red;
  font-weight: bold;
}

.error {
  color: white;
  background-color: red;
}

.warning {
  color: white;
  background-color: orange;
}

.notice {
  color: blue;
}

.info {
  color: black;
}

.debug {
  color: gray;
}

</style>
