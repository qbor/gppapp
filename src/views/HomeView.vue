<template>
  <div class="space-y-6">
    <!-- 头部：欢迎语 + 月份选择 -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ greeting }}，欢迎使用轻账</h2>
        <p class="mt-1 text-sm text-slate-400">这是你的 {{ monthLabel }} 财务概览</p>
      </div>
      <input v-model="month" type="month" class="input w-44" />
    </div>

    <!-- 加载骨架 -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="card h-32 animate-pulse bg-slate-100"></div>
    </div>

    <!-- 统计卡片 -->
    <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="当月收入"
        :value="`¥ ${fmtMoney(incomeOfMonth)}`"
        value-class="text-brand-600"
        icon-path="M12 19V5M5 12l7-7 7 7"
        icon-bg="bg-brand-50 text-brand-500"
      />
      <StatCard
        label="当月支出"
        :value="`¥ ${fmtMoney(expenseOfMonth)}`"
        value-class="text-rose-500"
        icon-path="M12 5v14M19 12l-7 7-7-7"
        icon-bg="bg-rose-50 text-rose-400"
      />
      <StatCard
        label="当月结余"
        :value="`¥ ${fmtMoney(balanceOfMonth)}`"
        :value-class="balanceOfMonth >= 0 ? 'text-slate-800' : 'text-rose-500'"
        icon-path="M22 12h-4l-3 9L9 3l-3 9H2"
        icon-bg="bg-ocean-50 text-ocean-500"
        :hint="balanceOfMonth >= 0 ? '收大于支，继续保持' : '本月支出超出收入'"
        hint-class="text-ocean-500"
      />
      <StatCard
        label="本月账单笔数"
        :value="`${countOfMonth} 笔`"
        value-class="text-slate-800"
        icon-path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        icon-bg="bg-slate-100 text-slate-500"
      />
    </div>

    <!-- 预算卡片 -->
    <div
      v-if="!isLoading && monthBudget > 0"
      class="card animate-fade-in p-5"
      :class="overBudget ? 'border-rose-200 bg-rose-50/60' : ''"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="overBudget ? 'bg-rose-100 text-rose-500' : 'bg-brand-50 text-brand-500'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <div>
            <p class="text-sm font-medium text-slate-700">本月预算</p>
            <p class="text-xs text-slate-400">预算 ¥{{ fmtMoney(monthBudget) }} · 已用 ¥{{ fmtMoney(expenseOfMonth) }}</p>
          </div>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="overBudget ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600'"
        >
          {{ overBudget ? `已超支 ¥${fmtMoney(Math.abs(monthBudget - expenseOfMonth))}` : `剩余 ¥${fmtMoney(monthBudget - expenseOfMonth)}` }}
        </span>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="overBudget ? 'bg-rose-400' : 'bg-brand-400'"
          :style="{ width: `${Math.min(100, budgetPercent)}%` }"
        ></div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="grid gap-6 xl:grid-cols-5">
      <!-- 分类占比饼图 -->
      <div class="card animate-fade-in p-5 xl:col-span-2">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-medium text-slate-700">分类占比</h3>
          <div class="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              class="rounded-md px-2.5 py-1 font-medium transition-all"
              :class="pieType === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'"
              @click="pieType = 'expense'"
            >
              支出
            </button>
            <button
              class="rounded-md px-2.5 py-1 font-medium transition-all"
              :class="pieType === 'income' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'"
              @click="pieType = 'income'"
            >
              收入
            </button>
          </div>
        </div>
        <p class="mb-2 text-xs text-slate-400">{{ monthLabel }} {{ pieType === 'expense' ? '支出' : '收入' }}分类占比</p>
        <EChart v-if="pieOption" :option="pieOption" height="300px" />
        <div v-if="!isLoading && pieData.length === 0" class="flex h-[300px] items-center justify-center text-sm text-slate-400">
          本月暂无{{ pieType === 'expense' ? '支出' : '收入' }}账单，去记一笔吧
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="card animate-fade-in p-5 xl:col-span-3">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-medium text-slate-700">收支趋势</h3>
          <div class="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              class="rounded-md px-2.5 py-1 font-medium transition-all"
              :class="trendRange === '30d' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'"
              @click="trendRange = '30d'"
            >
              近 30 天
            </button>
            <button
              class="rounded-md px-2.5 py-1 font-medium transition-all"
              :class="trendRange === '12m' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'"
              @click="trendRange = '12m'"
            >
              近 12 个月
            </button>
          </div>
        </div>
        <p class="mb-2 text-xs text-slate-400">{{ trendRange === '30d' ? '每日收支变化' : '每月收支变化' }}</p>
        <EChart v-if="trendOption" :option="trendOption" height="300px" />
        <div v-if="!isLoading && trendData.length === 0" class="flex h-[300px] items-center justify-center text-sm text-slate-400">
          暂无趋势数据，记录账单后这里会展示收支规律
        </div>
      </div>
    </div>

    <!-- 近期账单 -->
    <div class="card animate-fade-in p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-medium text-slate-700">近期账单</h3>
        <RouterLink to="/transactions" class="text-sm font-medium text-ocean-500 transition-colors hover:text-ocean-600">
          查看全部 →
        </RouterLink>
      </div>

      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100"></div>
      </div>

      <div v-else-if="recentBills.length === 0">
        <EmptyState
          title="还没有账单记录"
          description="点击下方按钮，记录你的第一笔收支"
          :action="{ to: '/record', label: '记一笔' }"
        />
      </div>

      <ul v-else class="divide-y divide-slate-50">
        <li v-for="bill in recentBills" :key="bill.id" class="flex items-center gap-4 py-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="TYPE_COLOR[bill.type].bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" :class="TYPE_COLOR[bill.type].text">
              <path :d="bill.type === 'expense' ? 'M12 5v14M19 12l-7 7-7-7' : 'M12 19V5M5 12l7-7 7 7'" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700">{{ bill.category }}<span v-if="bill.note" class="ml-2 truncate text-xs font-normal text-slate-400">{{ bill.note }}</span></p>
            <p class="text-xs text-slate-400">{{ bill.record_date }}</p>
          </div>
          <span class="num text-sm font-semibold" :class="TYPE_COLOR[bill.type].text">
            {{ bill.type === 'expense' ? '-' : '+' }}¥{{ fmtMoney(bill.amount) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { bills, budgets, isLoading } from '@/composables/useFinance'
import StatCard from '@/components/StatCard.vue'
import EChart from '@/components/EChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import { TYPE_COLOR, fmtMoney, formatMonth } from '@/lib/utils'

const month = ref(formatMonth())
const pieType = ref('expense')
const trendRange = ref('30d')

// ---- 当月统计 ----
const monthBills = computed(() => bills.value.filter((b) => b.record_date.startsWith(month.value)))
const incomeOfMonth = computed(() => monthBills.value.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0))
const expenseOfMonth = computed(() => monthBills.value.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0))
const balanceOfMonth = computed(() => incomeOfMonth.value - expenseOfMonth.value)
const countOfMonth = computed(() => monthBills.value.length)
const monthLabel = computed(() => {
  const [y, m] = month.value.split('-')
  return `${y}年${Number(m)}月`
})

// ---- 预算 ----
const monthBudget = computed(() => Number(budgets.value[month.value] || 0))
const budgetPercent = computed(() => (monthBudget.value > 0 ? (expenseOfMonth.value / monthBudget.value) * 100 : 0))
const overBudget = computed(() => monthBudget.value > 0 && expenseOfMonth.value > monthBudget.value)

// ---- 饼图数据 ----
const pieData = computed(() => {
  const map = {}
  monthBills.value
    .filter((b) => b.type === pieType.value)
    .forEach((b) => {
      map[b.category] = (map[b.category] || 0) + b.amount
    })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
})

const PIE_COLORS = ['#2aa884', '#2d88af', '#7fd8b9', '#82c4de', '#f4a261', '#e76f51', '#9b8cff', '#5aa9e6', '#b8c0c9', '#f2cc8f']

const pieOption = computed(() => {
  if (pieData.value.length === 0) return null
  return {
    color: PIE_COLORS,
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>¥${fmtMoney(p.value)}（${p.percent}%）`
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    series: [
      {
        name: '分类占比',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 600, formatter: '{b}\n¥{c}' }
        },
        data: pieData.value
      }
    ]
  }
})

// ---- 趋势数据 ----
const trendData = computed(() => {
  if (trendRange.value === '30d') {
    // 近 30 天：每天收入/支出合计
    const days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, income: 0, expense: 0 })
    }
    const map = new Map(days.map((d) => [d.date, d]))
    bills.value.forEach((b) => {
      const day = map.get(b.record_date)
      if (day) day[b.type] += b.amount
    })
    return days
  }
  // 近 12 个月
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ month: key, label: `${d.getMonth() + 1}月`, income: 0, expense: 0 })
  }
  const map = new Map(months.map((m) => [m.month, m]))
  bills.value.forEach((b) => {
    const m = map.get(b.record_date.slice(0, 7))
    if (m) m[b.type] += b.amount
  })
  return months
})

const trendOption = computed(() => {
  if (trendData.value.length === 0) return null
  const isMonth = trendRange.value === '12m'
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (items) => {
        const head = items[0]?.axisValue || ''
        return items
          .map((it) => `${it.marker}${it.seriesName}：¥${fmtMoney(it.value)}`)
          .join('<br/>')
          .replace(head, `<b>${head}</b><br/>`)
      }
    },
    legend: { data: ['收入', '支出'], top: 0, right: 8, itemWidth: 12, itemHeight: 12, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
    grid: { left: 12, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.value.map((d) => d.label),
      boundaryGap: isMonth,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v) => (v >= 10000 ? `${v / 10000}w` : v) },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: '收入',
        type: isMonth ? 'bar' : 'line',
        smooth: true,
        symbolSize: 5,
        data: trendData.value.map((d) => Number(d.income.toFixed(2))),
        itemStyle: { color: '#2aa884', borderRadius: isMonth ? [4, 4, 0, 0] : 0 },
        lineStyle: { width: 2.5 },
        areaStyle: isMonth ? undefined : { color: 'rgba(42, 168, 132, 0.10)' }
      },
      {
        name: '支出',
        type: isMonth ? 'bar' : 'line',
        smooth: true,
        symbolSize: 5,
        data: trendData.value.map((d) => Number(d.expense.toFixed(2))),
        itemStyle: { color: '#f4a261', borderRadius: isMonth ? [4, 4, 0, 0] : 0 },
        lineStyle: { width: 2.5 },
        areaStyle: isMonth ? undefined : { color: 'rgba(244, 162, 97, 0.10)' }
      }
    ]
  }
})

// ---- 近期账单（最新 6 条）----
const recentBills = computed(() => bills.value.slice(0, 6))

// ---- 欢迎语 ----
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
</script>
