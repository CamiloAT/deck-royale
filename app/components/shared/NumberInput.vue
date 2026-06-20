<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>(), {
  min: 0,
  max: Infinity,
  step: 1,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const canDecrement = computed(() => props.modelValue > props.min)
const canIncrement = computed(() => props.modelValue < props.max)

function snapToStep(value: number): number {
  if (props.step <= 1) return value
  const stepped = Math.round(value / props.step) * props.step
  return Math.min(props.max, Math.max(props.min, stepped))
}

function decrement() {
  if (canDecrement.value) {
    const next = props.modelValue - props.step
    emit('update:modelValue', Math.max(props.min, snapToStep(next)))
  }
}

function increment() {
  if (canIncrement.value) {
    const next = props.modelValue + props.step
    emit('update:modelValue', Math.min(props.max, snapToStep(next)))
  }
}

function onInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    emit('update:modelValue', Math.min(props.max, Math.max(props.min, val)))
  }
}
</script>

<template>
  <div class="number-input">
    <button
      class="number-input__btn number-input__btn--dec"
      :disabled="!canDecrement"
      @click="decrement"
      type="button"
    >
      <Minus :size="14" />
    </button>
    <input
      class="number-input__value"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      @input="onInput"
    />
    <button
      class="number-input__btn number-input__btn--inc"
      :disabled="!canIncrement"
      @click="increment"
      type="button"
    >
      <Plus :size="14" />
    </button>
  </div>
</template>

<style scoped>
.number-input {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 100%;
}
.number-input:focus-within {
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.06);
}

.number-input__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.number-input__btn:hover:not(:disabled) {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
}
.number-input__btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.number-input__value {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 0 2px;
  background: none;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  color: #ffd700;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  font-family: inherit;
  -moz-appearance: textfield;
}
.number-input__value::-webkit-inner-spin-button,
.number-input__value::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
