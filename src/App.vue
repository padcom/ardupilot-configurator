<template>
  <div v-if="!loading" class="search-bar">
    <label>Search</label>
    <input v-model="search">
    <label>Dataset</label>
    <select v-model="dataset">
      <option value="1">User</option>
      <option value="2">Advanced</option>
    </select>
    <label>Numeric inputs</label>
    <input v-model="numeric" type="checkbox">
    <button :disabled="changed.length === 0" @click="saveChangedValues()">Write params</button>
    <MessageDisplay ref="message" />
    <div class="spacer" />
    <HeartbeatIndicator ref="heartbeat" />
    <SystemTime ref="systemTime" />
  </div>
  <table v-if="!loading" class="parameters">
    <thead>
      <tr>
        <th class="param-id">Name</th>
        <th class="param-value">Value</th>
        <th class="param-unit">Unit</th>
        <th class="param-description">Description</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="param in scopedParams" :key="param.paramId">
        <td class="param-id" :class="{ reboot: definitions.get(param.paramId)?.rebootRequired }">
          {{ param.paramId }}
        </td>
        <td class="param-value" :class="{ modified: param.orgValue !== param.paramValue }"
          :data-org-value="param.orgValue"
          :data-value="param.paramValue"
        >
          <NumericInput v-if="numeric" v-model="param.paramValue"
            :name="param.paramId"
          />
          <RangeInput v-else-if="definitions.get(param.paramId)?.range"
            v-model="param.paramValue"
            :name="param.paramId"
            :min="definitions.get(param.paramId)!.range!.low"
            :max="definitions.get(param.paramId)!.range!.high"
          />
          <SelectInput v-else-if="definitions.get(param.paramId)?.values"
            v-model="param.paramValue"
            :name="param.paramId"
            :values="definitions.get(param.paramId)!.values!"
          />
          <BitmaskInput v-else-if="definitions.get(param.paramId)?.bitmask"
            v-model="param.paramValue"
            :name="param.paramId"
            :values="definitions.get(param.paramId)!.bitmask!"
          />
          <NumericInput v-else v-model="param.paramValue"
            :name="param.paramId"
          />
        </td>
        <td class="param-unit">
          {{ definitions.get(param.paramId)?.units }}
        </td>
        <td class="param-description" :title="definitions.get(param.paramId)?.description">
          {{ definitions.get(param.paramId)?.displayName }}
        </td>
      </tr>
    </tbody>
  </table>
  <div v-else>Loading parameter {{ params.size }} of {{ paramCount }} ({{ loadedParameter }})</div>
</template>

<script lang="ts" setup>
import type { MavParamType } from 'mavlink-mappings/dist/lib/common'
import { ref, onBeforeMount, onMounted, computed } from 'vue'

import MessageDisplay from './components/MessageDisplay.vue'
import SystemTime from './components/SystemTime.vue'
import HeartbeatIndicator from './components/HeartbeatIndicator.vue'
import RangeInput from './components/RangeInput.vue'
import SelectInput from './components/SelectInput.vue'
import BitmaskInput from './components/BitmaskInput.vue'
import NumericInput from './components/NumericInput.vue'

interface Param {
  paramId: string
  paramValue: number
  paramType: MavParamType
  orgValue: number
}

interface Definition {
  name: string
  group: string
  description: string
  displayName: string
  rebootRequired: boolean
  units?: string
  bitmask?: Map<number, string>
  values?: Map<number, string>
  range?: { low: number, high: number }
  user?: 'Standard' | 'Advanced'
}

const message = ref<InstanceType<typeof MessageDisplay>>()
const systemTime = ref<InstanceType<typeof SystemTime>>()
const heartbeat = ref<InstanceType<typeof HeartbeatIndicator>>()
const definitions = ref<Map<string, Definition>>(new Map())
const loading = ref(true)
const paramCount = ref(0)
const loadedParameter = ref('')
const params = ref<Map<string, Param>>(new Map())
const search = ref('')
const dataset = ref('2')
const numeric = ref(false)

const sortedParams = computed(() => [...params.value.values()].sort((p1, p2) => p1.paramId.localeCompare(p2.paramId)))
const filteredParams = computed(() => search.value === ''
  ? sortedParams.value
  : sortedParams.value.filter(param => param.paramId.toLowerCase().includes(search.value.toLowerCase())))
const scopedParams = computed(() => filteredParams.value.filter(param => {
  if (dataset.value === '2' || definitions.value.get(param.paramId)?.user === 'Advanced') {
    return true
  } else {
    return false
  }
}))
const changed = computed(() => [...params.value.values()]
  .filter(param => param.orgValue !== param.paramValue))

function round(n: number) {
  return (Math.round(n * 100000)) / 100000
}

// eslint-disable-next-line max-lines-per-function
onBeforeMount(async () => {
  const response = await fetch('https://autotest.ardupilot.org/Parameters/ArduCopter/apm.pdef.json')
  if (response.ok) {
    const data: Record<string, Record<string, any>> = await response.json()

    const temp = new Map<string, Definition>()

    // eslint-disable-next-line max-lines-per-function
    Object.entries(data).forEach(([group, items]) => {
      // eslint-disable-next-line complexity
      Object.entries(items).forEach(([name, def]) => {
        const definition: Definition = {
          name,
          group,
          description: def.Description,
          displayName: def.DisplayName,
          rebootRequired: def.RebootRequired === 'True',
        }
        if (def.Range) {
          definition.range = {
            low: parseFloat(def.Range.low),
            high: parseFloat(def.Range.high),
          }
        }
        if (def.Units) definition.units = def.Units
        if (def.Bitmask) {
          definition.bitmask = new Map<number, string>()

          Object.entries(def.Bitmask).forEach(([bit, description]) => {
            definition.bitmask!.set(parseInt(bit), description as string)
          })
        }
        if (def.Values) {
          definition.values = new Map<number, string>()
          Object.entries(def.Values).forEach(([value, description]) => {
            definition.values!.set(round(parseFloat(value)), description as string)
          })
        }
        if (def.User) definition.user = def.User

        temp.set(name, definition)
      })
    })

    definitions.value = temp
  }
})

onMounted(() => {
  import.meta.hot?.send('param-request-list')
})

import.meta.hot?.on('heartbeat', () => {
  heartbeat.value?.ping()
})

import.meta.hot?.on('time-sync', data => {
  systemTime.value?.update(data.ts1)
})

import.meta.hot?.on('param-value', data => {
  loadedParameter.value = data.paramId
  data.paramValue = round(data.paramValue)

  params.value.set(data.paramId, { ...data, orgValue: data.paramValue })

  if (loading.value) {
    paramCount.value = data.paramCount

    if (data.paramIndex + 1 === data.paramCount) {
      console.log('Done loading parameters')
      loading.value = false
    }
  }
})

function saveChangedValues() {
  changed.value.forEach(param => {
    import.meta.hot?.send('save-param-value', {
      paramId: param.paramId,
      paramValue: param.paramValue,
      paramType: param.paramType,
    })

    param.paramValue = param.orgValue
  })
}

import.meta.hot?.on('status-text', data => {
  console.log('status-text', data)
  message.value?.show(data.text, data.severity)
})

</script>

<style lang="postcss">
.search-bar {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  padding-top: 1rem;
  padding-bottom: 1rem;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
  padding-inline: 8px;

  & button {
    padding: 4px 16px;
    border-radius: 10px;
    border: solid 1px black;
    outline: none;
  }
}

.spacer {
  flex-grow: 1;
}

.parameters {
  width: 100%;
  border-collapse: collapse;
  position: relative;

  & thead {
    & tr {
      border-bottom: solid 2px black;
      position: sticky;
      top: 55px;
      background-color: white;
      z-index: 1;
    }
    & th {
      border: solid 1px rgba(0, 0, 0, 0.2);
      padding: 8px 4px;
      font-weight: bolder;
      position: sticky;
      top: 55px;
      background-color: white;
      z-index: 1;
    }
  }

  & tbody {
    & td {
      border: solid 1px rgba(0, 0, 0, 0.2);
      padding: 2px 4px;
      color: #35495e;

      &.param-id {
        width: 192px;

        &.reboot {
          font-weight: bold;
        }
      }

      &.param-value {
        width: 350px;

        &.modified input,
        &.modified .multiselect__tags,
        &.modified .multiselect__single {
          background-color: rgb(0, 184, 0);
          color: white;
          font-weight: bold;
        }
      }

      &.param-unit {
        width: 100px;
        padding-left: 8px;
      }
    }
  }
}
</style>
