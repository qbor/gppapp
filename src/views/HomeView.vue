<template>
  <div class="space-y-6">
    <!-- 头部：欢迎语 + 时间维度切换 -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:text-2xl">{{ greeting }}，欢迎使用快计</h2>
        <p class="mt-1 text-sm text-slate-400">这是你的 {{ rangeLabelText }} 财务概览</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- 上一期 / 下一期 -->
        <div class="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <button class="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800" @click="shift(-1)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button class="flex h-9 w-9 items-center justify-center border-l border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" @click="shift(1)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <!-- 粒度切换 -->
        <div class="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
          <button
            v-for="g in granularities"
            :key="g.key"
            class="rounded-md px-2.5 py-1.5 font-medium transition-all"
            :class="granularity === g.key ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'"
            @click="setGranularity(g.key)"
          >
            {{ g.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 跨月对比（默认收起） -->
    <div class="card animate-fade-in p-4 sm:p-5">
      <button class="flex w-full items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200" @click="showCompare = !showCompare">
        <span>📊 跨月收支对比</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 transition-transform" :class="showCompare ? 'rotate-180' : ''"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div v-if="showCompare" class="mt-4">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <input v-model="compareM1" type="month" class="input w-36" />
          <span class="text-slate-400">vs</span>
          <input v-model="compareM2" type="month" class="input w-36" />
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-700">
                <th class="py-2">指标</th>
                <th class="py-2">{{ compareM1 }}</th>
                <th class="py-2">{{ compareM2 }}</th>
                <th class="py-2">差额</th>
              </tr>
            </thead>
            <tbody class="text-slate-700 dark:text-slate-200">
              <tr class="border-b border-slate-50 dark:border-slate-800">
                <td class="py-2">收入</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m1.income) }}</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m2.income) }}</td>
                <td class="num py-2" :class="compareResult.diff.income >= 0 ? 'text-brand-600' : 'text-rose-500'">{{ compareResult.diff.income >= 0 ? '+' : '' }}{{ currencySymbol }}{{ fmtMoney(compareResult.diff.income) }}</td>
              </tr>
              <tr class="border-b border-slate-50 dark:border-slate-800">
                <td class="py-2">支出</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m1.expense) }}</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m2.expense) }}</td>
                <td class="num py-2" :class="compareResult.diff.expense <= 0 ? 'text-brand-600' : 'text-rose-500'">{{ compareResult.diff.expense >= 0 ? '+' : '' }}{{ currencySymbol }}{{ fmtMoney(compareResult.diff.expense) }}</td>
              </tr>
              <tr>
                <td class="py-2">结余</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m1.balance) }}</td>
                <td class="num py-2">{{ currencySymbol }}{{ fmtMoney(compareResult.m2.balance) }}</td>
                <td class="num py-2" :class="compareResult.diff.balance >= 0 ? 'text-brand-600' : 'text-rose-500'">{{ compareResult.diff.balance >= 0 ? '+' : '' }}{{ currencySymbol }}{{ fmtMoney(compareResult.diff.balance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 加载骨架 -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800"></div>
    </div>

    <!-- 统计卡片 -->
    <div v-else class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="区间收入" :value="`${currencySymbol}${fmtMoney(rangeStats.income)}`" value-class="text-brand-600" icon-path="M12 19V5M5 12l7-7 7 7" icon-bg="bg-brand-50 text-brand-500" />
      <StatCard label="区间支出" :value="`${currencySymbol}${fmtMoney(rangeStats.expense)}`" value-class="text-rose-500" icon-path="M12 5v14M19 12l-7 7-7-7" icon-bg="bg-rose-50 text-rose-400" />
      <StatCard
        label="区间结余"
        :value="`${currencySymbol}${fmtMoney(rangeStats.balance)}`"
        :value-class="rangeStats.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-500'"
        icon-path="M22 12h-4l-3 9L9 3l-3 9H2"
        icon-bg="bg-ocean-50 text-ocean-500"
        :hint="rangeStats.balance >= 0 ? '收大于支，继续保持' : '本期支出超出收入'"
        hint-class="text-ocean-500"
      />
      <StatCard label="区间账单笔数" :value="`${rangeStats.count} 笔`" value-class="text-slate-800 dark:text-slate-100" icon-path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" icon-bg="bg-slate-100 text-slate-500" />
    </div>

    <!-- 预算卡片（当月） -->
    <div
      v-if="!isLoading && monthBudget > 0"
      class="card animate-fade-in p-5"
      :class="overBudget ? 'border-rose-200 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-900/20' : ''"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl" :class="overBudget ? 'bg-rose-100 text-rose-500 dark:bg-rose-800' : 'bg-brand-50 text-brand-500 dark:bg-brand-900/40'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </span>
          <div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">本月预算</p>
            <p class="text-xs text-slate-400">预算 {{ currencySymbol }}{{ fmtMoney(monthBudget) }} · 已用 {{ currencySymbol }}{{ fmtMoney(monthExpense) }}</p>
          </div>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-medium" :class="overBudget ? 'bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-rose-200' : 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300'">
          {{ overBudget ? `已超支 ${currencySymbol}${fmtMoney(Math.abs(monthBudget - monthExpense))}` : `剩余 ${currencySymbol}${fmtMoney(monthBudget - monthExpense)}` }}
        </span>
      </div>
      <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div class="h-full rounded-full transition-all duration-500" :class="overBudget ? 'bg-rose-400' : 'bg-brand-400'" :style="{ width: `${Math.min(100, budgetPercent)}%` }"></div>
      </div>
    </div>

    <!-- 资产总览 + 消费排行 -->
    <div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <!-- 资产总览 -->
      <div class="card animate-fade-in p-5">
        <div class="mb-4 flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-900/40"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg></span>
          <h3 class="font-medium text-slate-700 dark:text-slate-200">资产总览</h3>
          <span class="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">总资产</span>
        </div>
        <p class="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          {{ currencySymbol }}{{ fmtMoney(totalAssets) }}
          <span class="ml-2 text-xs font-normal text-slate-400">{{ accounts.length }} 个账户</span>
        </p>
        <ul v-if="accounts.length" class="space-y-2.5">
          <li v-for="acc in accounts" :key="acc.id" class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-lg dark:bg-slate-800">{{ ACCOUNT_ICONS[acc.icon] || '💰' }}</span>
            <span class="flex-1 text-sm text-slate-700 dark:text-slate-200">{{ acc.name }}</span>
            <span class="num text-sm font-semibold text-slate-800 dark:text-slate-100">{{ currencySymbol }}{{ fmtMoney(acc.balance) }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">暂无账户，去「分类与预算」页添加</p>
      </div>

      <!-- 消费排行 -->
      <div class="card animate-fade-in p-5">
        <div class="mb-4 flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-400 dark:bg-rose-900/40"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" /></svg></span>
          <h3 class="font-medium text-slate-700 dark:text-slate-200">消费排行 · {{ rangeLabelText }}</h3>
        </div>
        <div v-if="topCats.length" class="space-y-3">
          <div v-for="(cat, i) in topCats" :key="cat.name" class="flex items-center gap-3">
            <span class="w-5 text-center text-xs font-semibold text-slate-400">{{ i + 1 }}</span>
            <span class="w-14 truncate text-sm text-slate-700 dark:text-slate-200">{{ cat.name }}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full rounded-full bg-gradient-to-r from-brand-400 to-ocean-400" :style="{ width: `${(cat.value / topCats[0].value) * 100}%` }"></div>
            </div>
            <span class="num w-20 text-right text-sm font-medium text-slate-700 dark:text-slate-200">{{ currencySymbol }}{{ fmtMoney(cat.value) }}</span>
          </div>
          <div class="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
            <p class="mb-1.5 text-xs text-slate-400">单笔支出 TOP</p>
            <ul class="space-y-1">
              <li v-for="b in topBills" :key="b.id" class="flex items-center justify-between text-sm">
                <span class="truncate text-slate-600 dark:text-slate-300">{{ b.category }}<span v-if="b.note" class="ml-1 text-xs text-slate-400">{{ b.note }}</span></span>
                <span class="num font-medium text-rose-500">{{ currencySymbol }}{{ fmtMoney(b.amount) }}</span>
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">本区间暂无支出</p>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="grid gap-4 sm:gap-6 xl:grid-cols-5">
      <!-- 分类占比饼图 -->
      <div class="card animate-fade-in p-4 sm:p-5 xl:col-span-2">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-medium text-slate-700 dark:text-slate-200">分类占比</h3>
          <div class="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
            <button class="rounded-md px-2.5 py-1 font-medium transition-all" :class="pieType === 'expense' ? 'bg-white text-rose-500 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="pieType = 'expense'">支出</button>
            <button class="rounded-md px-2.5 py-1 font-medium transition-all" :class="pieType === 'income' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="pieType = 'income'">收入</button>
          </div>
        </div>
        <p class="mb-2 text-xs text-slate-400">{{ rangeLabelText }} {{ pieType === 'expense' ? '支出' : '收入' }}分类占比</p>
        <EChart v-if="pieOption" :option="pieOption" :height="pieHeight" />
        <div v-if="!isLoading && pieData.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">本区间暂无{{ pieType === 'expense' ? '支出' : '收入' }}账单，去记一笔吧</div>
      </div>

      <!-- 趋势图 -->
      <div class="card animate-fade-in p-4 sm:p-5 xl:col-span-3">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-medium text-slate-700 dark:text-slate-200">收支趋势</h3>
          <div class="flex rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
            <button class="rounded-md px-2.5 py-1 font-medium transition-all" :class="trendRange === '30d' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="trendRange = '30d'">近 30 天</button>
            <button class="rounded-md px-2.5 py-1 font-medium transition-all" :class="trendRange === '12m' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="trendRange = '12m'">近 12 个月</button>
          </div>
        </div>
        <p class="mb-2 text-xs text-slate-400">{{ trendRange === '30d' ? '每日收支变化' : '每月收支变化' }}</p>
        <EChart v-if="trendOption" :option="trendOption" :height="trendHeight" />
        <div v-if="!isLoading && trendData.length === 0" class="flex h-[280px] items-center justify-center text-sm text-slate-400">暂无趋势数据，记录账单后这里会展示收支规律</div>
      </div>
    </div>

    <!-- 年度汇总看板 -->
    <div class="card animate-fade-in p-5">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-50 text-ocean-500 dark:bg-ocean-900/30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span>
          <h3 class="font-medium text-slate-700 dark:text-slate-200">年度汇总</h3>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" @click="yearShift(-1)">‹</button>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ year }} 年</span>
          <button class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" @click="yearShift(1)">›</button>
        </div>
      </div>
      <div class="mb-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-3 lg:w-1/2">
        <div class="rounded-xl bg-brand-50 p-3 dark:bg-brand-900/30">
          <p class="text-xs text-slate-400">全年收入</p>
          <p class="num mt-1 text-lg font-bold text-brand-600 dark:text-brand-300">{{ currencySymbol }}{{ fmtMoney(annual.income) }}</p>
        </div>
        <div class="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/30">
          <p class="text-xs text-slate-400">全年支出</p>
          <p class="num mt-1 text-lg font-bold text-rose-500">{{ currencySymbol }}{{ fmtMoney(annual.expense) }}</p>
        </div>
        <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p class="text-xs text-slate-400">年度结余</p>
          <p class="num mt-1 text-lg font-bold" :class="annual.balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-500'">{{ currencySymbol }}{{ fmtMoney(annual.balance) }}</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <div v-for="m in annual.months" :key="m.month" class="rounded-xl border border-slate-100 p-3 dark:border-slate-700">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-300">{{ m.label }}</p>
          <p class="num mt-1 text-sm font-semibold text-brand-600 dark:text-brand-300">{{ currencySymbol }}{{ fmtMoney(m.income) }}</p>
          <p class="num text-sm font-semibold" :class="m.expense > 0 ? 'text-rose-500' : 'text-slate-300 dark:text-slate-600'">-{{ currencySymbol }}{{ fmtMoney(m.expense) }}</p>
          <p class="num mt-1 text-xs" :class="m.balance >= 0 ? 'text-slate-400' : 'text-rose-500'">{{ m.balance >= 0 ? '+' : '' }}{{ fmtMoney(m.balance) }}</p>
        </div>
      </div>
    </div>

    <!-- 近期账单 -->
    <div class="card animate-fade-in p-4 sm:p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-medium text-slate-700 dark:text-slate-200">近期账单</h3>
        <RouterLink to="/transactions" class="text-sm font-medium text-ocean-500 transition-colors hover:text-ocean-600">查看全部 →</RouterLink>
      </div>

      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <div v-else-if="recentBills.length === 0">
        <EmptyState title="还没有账单记录" description="点击下方按钮，记录你的第一笔收支" :action="{ to: '/record', label: '记一笔' }" />
      </div>

      <ul v-else class="divide-y divide-slate-50 dark:divide-slate-800">
        <li v-for="bill in recentBills" :key="bill.id" class="flex items-center gap-3 py-3 sm:gap-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="TYPE_COLOR[bill.type].bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" :class="TYPE_COLOR[bill.type].text">
              <path :d="bill.type === 'expense' ? 'M12 5v14M19 12l-7 7-7-7' : 'M12 19V5M5 12l7-7 7 7'" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ bill.category }}<span v-if="bill.note" class="ml-2 truncate text-xs font-normal text-slate-400">{{ bill.note }}</span>
              <span v-for="t in (bill.tags || [])" :key="t" class="ml-1 rounded bg-ocean-50 px-1.5 py-0.5 text-[10px] text-ocean-600 dark:bg-ocean-900/40 dark:text-ocean-300">#{{ t }}</span>
            </p>
            <p class="text-xs text-slate-400">{{ bill.record_date }}<span v-if="bill.account" class="ml-2">{{ bill.account }}</span></p>
          </div>
          <span class="num text-sm font-semibold" :class="TYPE_COLOR[bill.type].text">{{ bill.type === 'expense' ? '-' : '+' }}{{ currencySymbol }}{{ fmtMoney(bill.amount) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { bills, budgets, accounts, isLoading } from '@/composables/useFinance'
import StatCard from '@/components/StatCard.vue'
import EChart from '@/components/EChart.vue'
import EmptyState from '@/components/EmptyState.vue'
import { TYPE_COLOR, ACCOUNT_ICONS, fmtMoney, formatMonth } from '@/lib/utils'
import { currencySymbol } from '@/composables/useSettings'
import { billsInRange, rangeLabel, shiftAnchor, monthStats, compareMonths, annualSummary, topCategories, topExpenseBills } from '@/composables/useStats'

// ---- 时间维度 ----
const granularities = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'quarter', label: '季' },
  { key: 'year', label: '年' }
]
const granularity = ref('month')
const anchor = ref(new Date())

function setGranularity(g) {
  granularity.value = g
  anchor.value = new Date()
}
function shift(delta) {
  anchor.value = shiftAnchor(granularity.value, anchor.value, delta)
}

const rangeLabelText = computed(() => rangeLabel(granularity.value, anchor.value))
const rangeBills = computed(() => billsInRange(bills.value, granularity.value, anchor.value).list)

const rangeStats = computed(() => {
  const income = rangeBills.value.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const expense = rangeBills.value.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  return { income, expense, balance: income - expense, count: rangeBills.value.length }
})

// ---- 跨月对比 ----
const showCompare = ref(false)
const compareM1 = ref(formatMonth())
const compareM2 = ref(formatMonth(new Date(Date.now() - 30 * 24 * 3600 * 1000)))
const compareResult = computed(() => compareMonths(bills.value, compareM1.value, compareM2.value))

// ---- 当月预算 ----
const currentMonth = formatMonth()
const monthBudget = computed(() => Number(budgets.value[currentMonth] || 0))
const monthExpense = computed(() => monthStats(bills.value, currentMonth).expense)
const budgetPercent = computed(() => (monthBudget.value > 0 ? (monthExpense.value / monthBudget.value) * 100 : 0))
const overBudget = computed(() => monthBudget.value > 0 && monthExpense.value > monthBudget.value)

// ---- 资产总览 ----
const totalAssets = computed(() => accounts.value.reduce((s, a) => s + Number(a.balance || 0), 0))

// ---- 消费排行 ----
const topCats = computed(() => topCategories(rangeBills.value, 'expense', 5))
const topBills = computed(() => topExpenseBills(rangeBills.value, 3))

// ---- 饼图 ----
const pieType = ref('expense')
const pieData = computed(() => {
  const map = {}
  rangeBills.value.filter((b) => b.type === pieType.value).forEach((b) => {
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
    tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>${currencySymbol.value}${fmtMoney(p.value)}（${p.percent}%）` },
    legend: { orient: 'vertical', right: 8, top: 'middle', itemWidth: 10, itemHeight: 10, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
    series: [{ name: '分类占比', type: 'pie', radius: ['42%', '68%'], center: ['38%', '50%'], avoidLabelOverlap: true, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600, formatter: '{b}\n{c}' } }, data: pieData.value }]
  }
})

// ---- 趋势 ----
const trendRange = ref('30d')
const trendData = computed(() => {
  if (trendRange.value === '30d') {
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
    tooltip: { trigger: 'axis', formatter: (items) => {
      const head = items[0]?.axisValue || ''
      return items.map((it) => `${it.marker}${it.seriesName}：${currencySymbol.value}${fmtMoney(it.value)}`).join('<br/>').replace(head, `<b>${head}</b><br/>`)
    } },
    legend: { data: ['收入', '支出'], top: 0, right: 8, itemWidth: 12, itemHeight: 12, icon: 'circle', textStyle: { color: '#64748b', fontSize: 12 } },
    grid: { left: 12, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: trendData.value.map((d) => d.label), boundaryGap: isMonth, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v) => (v >= 10000 ? `${v / 10000}w` : v) }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: '收入', type: isMonth ? 'bar' : 'line', smooth: true, symbolSize: 5, data: trendData.value.map((d) => Number(d.income.toFixed(2))), itemStyle: { color: '#2aa884', borderRadius: isMonth ? [4, 4, 0, 0] : 0 }, lineStyle: { width: 2.5 }, areaStyle: isMonth ? undefined : { color: 'rgba(42, 168, 132, 0.10)' } },
      { name: '支出', type: isMonth ? 'bar' : 'line', smooth: true, symbolSize: 5, data: trendData.value.map((d) => Number(d.expense.toFixed(2))), itemStyle: { color: '#f4a261', borderRadius: isMonth ? [4, 4, 0, 0] : 0 }, lineStyle: { width: 2.5 }, areaStyle: isMonth ? undefined : { color: 'rgba(244, 162, 97, 0.10)' } }
    ]
  }
})

// ---- 年度看板 ----
const year = ref(new Date().getFullYear())
const annual = computed(() => annualSummary(bills.value, year.value))
function yearShift(delta) {
  year.value += delta
}

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

// 图表高度
const pieHeight = '280px'
const trendHeight = '280px'
</script>
