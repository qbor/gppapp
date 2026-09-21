<template>
  <div ref="el" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 按需注册，显著减小打包体积
echarts.use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '320px' }
})

const el = ref(null)
let chart = null
let observer = null

function render() {
  if (!chart) return
  chart.setOption(props.option, true)
}

onMounted(() => {
  chart = echarts.init(el.value)
  render()

  // 容器尺寸变化时自适应
  observer = new ResizeObserver(() => chart && chart.resize())
  observer.observe(el.value)
  window.addEventListener('resize', resize)
})

function resize() {
  chart && chart.resize()
}

onBeforeUnmount(() => {
  observer && observer.disconnect()
  window.removeEventListener('resize', resize)
  chart && chart.dispose()
  chart = null
})

watch(() => props.option, render, { deep: true })
</script>
