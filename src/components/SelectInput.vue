<template>
  <Multiselect v-model="editable"
    :options
    track-by="value"
    label="name"
    selected-label=""
    select-label=""
    deselect-label=""
    :searchable="false"
    :allow-empty="false"
  >
    <template #option="{ option }">
      {{ option.name || option.value }}
    </template>
    <template #singleLabel="{ option }">
      {{ option.name || option.value }}
    </template>
  </Multiselect>
</template>

<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import Multiselect from 'vue-multiselect'

const props = defineProps({
  name: { type: String, required: true },
  values: { type: Map as PropType<Map<number, string>>, default: () => [] },
})

const value = defineModel<number>({ required: true })

const options = computed(() => [...props.values.entries()].map(([val, name]) => ({
  name,
  value: val,
})))

const editable = computed({
  get() {
    return options.value.find(option => option.value === value.value)
  },
  set(newValue: any) {
    value.value = newValue.value
  },
})
</script>

<style lang="postcss">
@import "vue-multiselect/dist/vue-multiselect.min.css";

.multiselect__tags {
  border: none;
}
</style>
