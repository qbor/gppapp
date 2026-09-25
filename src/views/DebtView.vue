<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:text-2xl">债务</h2>
      <p class="mt-1 text-sm text-slate-400">记录借出、借入，随时掌握应收与应付</p>
    </div>

    <!-- 汇总卡片 -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <div class="card animate-fade-in p-4 sm:p-5">
        <p class="text-xs text-slate-400">应收（借出）</p>
        <p class="num mt-1.5 text-xl font-bold text-brand-600 dark:text-brand-300">{{ currencySymbol }}{{ fmtMoney(summary.receivable) }}</p>
        <p class="mt-1 text-xs text-slate-400">已收 {{ currencySymbol }}{{ fmtMoney(summary.received) }}</p>
      </div>
      <div class="card animate-fade-in p-4 sm:p-5">
        <p class="text-xs text-slate-400">应付（借入）</p>
        <p class="num mt-1.5 text-xl font-bold text-rose-500">{{ currencySymbol }}{{ fmtMoney(summary.payable) }}</p>
        <p class="mt-1 text-xs text-slate-400">已还 {{ currencySymbol }}{{ fmtMoney(summary.paid) }}</p>
      </div>
    </div>

    <!-- 新增债务 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">＋ 新增记录</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="label" for="d-direction">类型</label>
          <div class="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button class="rounded-lg py-2 text-sm font-medium transition-all" :class="form.direction === 'lend' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500' " @click="form.direction = 'lend'">我借出</button>
            <button class="rounded-lg py-2 text-sm font-medium transition-all" :class="form.direction === 'borrow' ? 'bg-white text-rose-500 shadow-sm dark:bg-slate-700' : 'text-slate-500'" @click="form.direction = 'borrow'">我借入</button>
          </div>
        </div>
        <div>
          <label class="label" for="d-name">对方姓名</label>
          <input id="d-name" v-model.trim="form.name" type="text" class="input" maxlength="20" placeholder="如：张三" />
        </div>
        <div>
          <label class="label" for="d-amount">金额</label>
          <input id="d-amount" v-model="form.amount" type="number" min="0" step="0.01" class="input num" placeholder="0.00" />
        </div>
        <div>
          <label class="label" for="d-note">备注</label>
          <input id="d-note" v-model.trim="form.note" type="text" class="input" maxlength="40" placeholder="选填，如：3 月还" />
        </div>
      </div>
      <button class="btn-primary mt-4 w-full sm:w-auto" :disabled="saving" @click="handleAdd">
        <span>{{ saving ? '保存中…' : '保存记录' }}</span>
      </button>
    </div>

    <!-- 债务列表 -->
    <div class="card animate-fade-in p-4 sm:p-5">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">记录列表</h3>

      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <div v-else-if="debts.length === 0">
        <p class="py-8 text-center text-sm text-slate-400">暂无债务记录，借钱给朋友或向朋友借钱时记一笔吧</p>
      </div>

      <ul v-else class="divide-y divide-slate-50 dark:divide-slate-800">
        <li v-for="d in debts" :key="d.id" class="flex items-center gap-3 py-3.5 sm:gap-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="d.direction === 'lend' ? 'bg-brand-50 text-brand-500 dark:bg-brand-900/40' : 'bg-rose-50 text-rose-400 dark:bg-rose-900/40'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
              <path :d="d.direction === 'lend' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ d.name }}
              <span class="ml-1.5 text-xs text-slate-400">{{ d.direction === 'lend' ? '借出' : '借入' }}</span>
              <span v-if="d.note" class="ml-1.5 text-xs text-slate-400">{{ d.note }}</span>
            </p>
            <p class="mt-0.5 text-xs" :class="statusMeta(d.status).class">{{ statusMeta(d.status).label }}</p>
          </div>
          <span class="num shrink-0 text-sm font-semibold" :class="d.direction === 'lend' ? 'text-brand-600 dark:text-brand-300' : 'text-rose-500'">{{ d.direction === 'lend' ? '+' : '-' }}{{ currencySymbol }}{{ fmtMoney(d.amount) }}</span>

          <div class="flex shrink-0 items-center gap-1.5">
            <button v-if="d.status === 'active'" class="rounded-lg px-2.5 py-1.5 text-xs font-medium" :class="d.direction === 'lend' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/40'" @click="handleSetStatus(d, 'settled')">
              {{ d.direction === 'lend' ? '已收回' : '已还清' }}
            </button>
            <button class="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30" title="删除" @click="handleDelete(d)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" /></svg>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { debts, isLoading, addDebt, setDebtStatus, deleteDebt } from '@/composables/useFinance'
import { toast } from '@/composables/useToast'
import { fmtMoney } from '@/lib/utils'
import { currencySymbol } from '@/composables/useSettings'

const STATUS_META = {
  active: { label: '未结清', class: 'text-amber-600' },
  pending: { label: '未结清', class: 'text-amber-600' }, // 兼容旧数据
  settled: { label: '已结清', class: 'text-ocean-600' }
}
function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.active
}

const form = reactive({ direction: 'lend', name: '', amount: '', note: '' })
const saving = ref(false)

const summary = computed(() => {
  let receivable = 0
  let received = 0
  let payable = 0
  let paid = 0
  debts.value.forEach((d) => {
    if (d.direction === 'lend') {
      receivable += d.amount
      if (d.status === 'settled') received += d.amount
    } else {
      payable += d.amount
      if (d.status === 'settled') paid += d.amount
    }
  })
  return { receivable, received, payable, paid }
})

async function handleAdd() {
  if (!form.name.trim()) return toast('请输入对方姓名', 'error')
  const amount = Number(form.amount)
  if (!amount || amount <= 0) return toast('请输入有效金额', 'error')
  saving.value = true
  try {
    await addDebt({ direction: form.direction, name: form.name.trim(), amount, note: form.note })
    toast('已保存债务记录', 'success')
    form.name = ''
    form.amount = ''
    form.note = ''
  } catch (err) {
    toast(err?.message || '保存失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}

async function handleSetStatus(d, status) {
  try {
    await setDebtStatus(d.id, status)
    toast(status === 'settled' ? (d.direction === 'lend' ? '已标记收回' : '已标记还清') : '已恢复未结清', 'success')
  } catch (err) {
    toast(err?.message || '操作失败', 'error')
  }
}

async function handleDelete(d) {
  try {
    await deleteDebt(d.id)
    toast('记录已删除', 'success')
  } catch (err) {
    toast(err?.message || '删除失败', 'error')
  }
}
</script>
