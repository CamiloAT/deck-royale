<script setup lang="ts">
defineProps<{ amount: number }>()
</script>

<template>
  <div class="pot-display">
    <div class="pot-display__label">Bote</div>
    <div class="pot-display__amount">
      <span class="pot-display__chip">$</span>
      {{ amount.toLocaleString() }}
    </div>
  </div>
</template>

<style scoped>
.pot-display { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pot-display__label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.pot-display__amount {
  color: #ffd700; font-size: 24px; font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  display: flex; align-items: center; gap: 6px;
}
.pot-display__chip {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #000; font-size: 16px; font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .pot-display__label { font-size: 10px; }
  .pot-display__amount { font-size: 18px; }
  .pot-display__chip { width: 22px; height: 22px; font-size: 13px; }
}
</style>
