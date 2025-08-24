<template>
  <Multiselect v-model="editable"
    :options
    track-by="value"
    label="name"
    selected-label=""
    select-label=""
    deselect-label=""
    :searchable="false"
    :multiple="true"
    placeholder=""
    :close-on-select="false"
  >
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
    return options.value.filter(option => (2 ** option.value & value.value) !== 0)
  },
  set(newValue: any[]) {
    value.value = newValue.reduce((acc, option) => acc + 2 ** option.value, 0)
  },
})
</script>

<style lang="postcss">
@import "vue-multiselect/dist/vue-multiselect.min.css";

.multiselect__tags {
  border: none;
}
</style>
