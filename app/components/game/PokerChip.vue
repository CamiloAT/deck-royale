<script setup lang="ts">
defineProps<{
  value: number
  color: string
  darkColor: string
  count: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove'): void
}>()

function formatValue(v: number): string {
  if (v >= 1000) return `${v / 1000}K`
  return String(v)
}
</script>

<template>
  <div class="poker-chip">
    <button
      class="poker-chip__body"
      :class="{
        'poker-chip__body--active': count > 0,
        'poker-chip__body--disabled': disabled,
      }"
      @click="!disabled && emit('add')"
      @contextmenu.prevent="!disabled && count > 0 && emit('remove')"
    >
      <div
        class="poker-chip__ring"
        :style="{
          background: `repeating-conic-gradient(${color} 0deg 12deg, ${darkColor} 12deg 24deg)`,
          borderColor: darkColor,
        }"
      >
        <div
          v-for="n in 8"
          :key="n"
          class="poker-chip__notch"
          :class="`poker-chip__notch--${n}`"
          :style="{ background: darkColor }"
        ></div>
      </div>
      <div class="poker-chip__inner">
        <span class="poker-chip__value" :style="{ color: color }">{{ formatValue(value) }}</span>
      </div>
    </button>
    <button
      v-if="count > 0"
      class="poker-chip__count"
      @click.stop="emit('remove')"
      title="Quitar ficha"
    >
      x{{ count }}
    </button>
  </div>
</template>

<style scoped>
.poker-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
}

.poker-chip__body {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  position: relative;
  overflow: visible;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: none;
  border: none;
  padding: 0;
  outline: none;
}

.poker-chip__body:hover:not(.poker-chip__body--disabled) {
  transform: translateY(-4px) scale(1.08);
}

.poker-chip__body:active:not(.poker-chip__body--disabled) {
  transform: translateY(0) scale(0.92);
  transition: all 0.1s;
}

.poker-chip__body--disabled {
  opacity: 0.25;
  cursor: not-allowed;
  filter: grayscale(0.6) brightness(0.7);
}

.poker-chip__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2.5px solid;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 3px rgba(255, 255, 255, 0.25),
    inset 0 -1px 3px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s;
}

.poker-chip__body--active .poker-chip__ring {
  box-shadow:
    0 0 16px rgba(255, 215, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 3px rgba(255, 255, 255, 0.25),
    inset 0 -1px 3px rgba(0, 0, 0, 0.2);
}

.poker-chip__body:hover:not(.poker-chip__body--disabled) .poker-chip__ring {
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.5),
    0 8px 16px rgba(0, 0, 0, 0.6),
    inset 0 1px 3px rgba(255, 255, 255, 0.25),
    inset 0 -1px 3px rgba(0, 0, 0, 0.2);
}

.poker-chip__notch {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
}
.poker-chip__notch--1 { top: 2px; left: 50%; transform: translateX(-50%); }
.poker-chip__notch--2 { bottom: 2px; left: 50%; transform: translateX(-50%); }
.poker-chip__notch--3 { left: 2px; top: 50%; transform: translateY(-50%); }
.poker-chip__notch--4 { right: 2px; top: 50%; transform: translateY(-50%); }
.poker-chip__notch--5 { top: 6px; left: 6px; }
.poker-chip__notch--6 { top: 6px; right: 6px; }
.poker-chip__notch--7 { bottom: 6px; left: 6px; }
.poker-chip__notch--8 { bottom: 6px; right: 6px; }

.poker-chip__inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffffff, #e8e8e8);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 2px rgba(0, 0, 0, 0.05);
}

.poker-chip__value {
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
}

.poker-chip__count {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #dc2626;
  padding: 1px 5px;
  border-radius: 6px;
  min-width: 16px;
  text-align: center;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.3;
}

.poker-chip__count:hover {
  background: #b91c1c;
  transform: scale(1.1);
}
</style>
