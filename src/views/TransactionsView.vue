<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">账单明细</h2>
        <p class="mt-1 text-sm text-slate-400">共 {{ filteredBills.length }} 条记录，最新账单置顶</p>
      </div>
      <button v-if="filteredBills.length > 0" class="btn-danger" @click="showClear = true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
        </svg>
        清空当月
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="card animate-fade-in grid gap-4 p-5 sm:grid-cols-3">
      <div>
        <label class="label" for="f-month">按月份</label>
        <input id="f-month" v-model="filters.month" type="month" class="input" />
      </div>
      <div>
        <label class="label" for="f-type">收支类型</label>
        <select id="f-type" v-model="filters.type" class="input">
          <option value="">全部</option>
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
      </div>
      <div>
        <label class="label" for="f-category">分类</label>
        <select id="f-category" v-model="filters.category" class="input">
          <option value="">全部分类</option>
          <option v-for="cat in filterCategories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
        </select>
      </div>
    </div>

    <!-- 账单列表 -->
    <div class="card animate-fade-in p-5">
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-xl bg-slate-100"></div>
      </div>

      <div v-else-if="filteredBills.length === 0">
        <div class="py-10 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-slate-300">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </div>
          <p class="mt-4 text-sm font-medium text-slate-600">当前筛选条件下暂无账单</p>
          <p class="mt-1 text-sm text-slate-400">试试调整筛选条件，或记一笔新账单</p>
          <RouterLink to="/record" class="btn-primary mt-5">去记账</RouterLink>
        </div>
      </div>

      <!-- 按日分组列表 -->
      <div v-else class="space-y-5">
        <div v-for="(group, date) in groupedBills" :key="date">
          <div class="mb-2 flex items-center gap-3">
            <span class="text-xs font-medium text-slate-400">{{ date }}</span>
            <span class="h-px flex-1 bg-slate-100"></span>
            <span class="num text-xs text-slate-400">
              支 ¥{{ fmtMoney(group.expense) }} <span class="mx-1 text-slate-200">|</span> 收 ¥{{ fmtMoney(group.income) }}
            </span>
          </div>
          <ul class="space-y-2">
            <li
              v-for="bill in group.list"
              :key="bill.id"
              class="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 transition-all duration-200 hover:border-slate-200 hover:shadow-card"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="TYPE_COLOR[bill.type].bg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" :class="TYPE_COLOR[bill.type].text">
                  <path :d="bill.type === 'expense' ? 'M12 5v14M19 12l-7 7-7-7' : 'M12 19V5M5 12l7-7 7 7'" />
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {{ bill.category }}
                  <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{{ TYPE_LABEL[bill.type] }}</span>
                </p>
                <p v-if="bill.note" class="truncate text-xs text-slate-400">{{ bill.note }}</p>
              </div>
              <span class="num text-sm font-semibold" :class="TYPE_COLOR[bill.type].text">
                {{ bill.type === 'expense' ? '-' : '+' }}¥{{ fmtMoney(bill.amount) }}
              </span>

              <!-- 悬浮操作按钮 -->
              <div class="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-ocean-50 hover:text-ocean-600" title="编辑" @click="openEdit(bill)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500" title="删除" @click="openDelete(bill)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <AppModal :visible="editVisible" title="编辑账单" :confirm-disabled="editSubmitting" @close="editVisible = false" @confirm="handleEditConfirm">
      <div v-if="editingBill" class="space-y-4">
        <div>
          <label class="label">收支类型</label>
          <div class="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              class="rounded-lg py-2 text-sm font-medium transition-all"
              :class="editForm.type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'"
              @click="editForm.type = 'expense'; editForm.category = ''"
            >
              支出
            </button>
            <button
              class="rounded-lg py-2 text-sm font-medium transition-all"
              :class="editForm.type === 'income' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'"
              @click="editForm.type = 'income'; editForm.category = ''"
            >
              收入
            </button>
          </div>
        </div>
        <div>
          <label class="label" for="e-amount">金额</label>
          <input id="e-amount" v-model="editForm.amount" type="number" min="0" step="0.01" class="input num" placeholder="0.00" />
        </div>
        <div>
          <label class="label">分类</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in editCategories"
              :key="cat.id"
              class="rounded-lg border px-3 py-1.5 text-sm transition-all"
              :class="editForm.category === cat.name ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'"
              @click="editForm.category = cat.name"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>
        <div>
          <label class="label" for="e-date">记账时间</label>
          <input id="e-date" v-model="editForm.record_date" type="date" class="input" :max="formatDate()" />
        </div>
        <div>
          <label class="label" for="e-note">备注说明</label>
          <input id="e-note" v-model.trim="editForm.note" type="text" class="input" maxlength="60" placeholder="选填" />
        </div>
      </div>
    </AppModal>

    <!-- 删除确认 -->
    <AppModal :visible="deleteVisible" title="删除账单" confirm-text="删除" @close="deleteVisible = false" @confirm="handleDeleteConfirm">
      <p class="text-sm leading-relaxed text-slate-500">
        确定删除这笔「{{ deletingBill?.category }}」账单吗？金额
        <span class="num font-semibold" :class="TYPE_COLOR[deletingBill?.type || 'expense'].text">
          ¥{{ fmtMoney(deletingBill?.amount) }}
        </span>
        ，删除后不可恢复。
      </p>
    </AppModal>

    <!-- 清空当月确认 -->
    <AppModal :visible="showClear" title="清空当月账单" confirm-text="确认清空" :confirm-disabled="clearing" @close="showClear = false" @confirm="handleClearMonth">
      <p class="text-sm leading-relaxed text-slate-500">
        将删除 <b class="text-slate-700">{{ filters.month || '当前筛选月份' }}</b> 的全部账单
        <b class="num text-slate-700">（{{ filteredBills.length }} 条）</b>，此操作不可恢复，请谨慎确认。
      </p>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { bills, categories, isLoading, updateBill, deleteBill, clearMonthBills } from '@/composables/useFinance'
import { toast } from '@/composables/useToast'
import AppModal from '@/components/AppModal.vue'
import { TYPE_COLOR, TYPE_LABEL, fmtMoney, formatDate, formatMonth, validateAmount } from '@/lib/utils'

const filters = reactive({ month: formatMonth(), type: '', category: '' })

// ---- 筛选 ----
const filterCategories = computed(() => {
  if (!filters.type) return categories.value
  return categories.value.filter((c) => c.type === filters.type)
})

const filteredBills = computed(() => {
  return bills.value.filter((b) => {
    if (filters.month && !b.record_date.startsWith(filters.month)) return false
    if (filters.type && b.type !== filters.type) return false
    if (filters.category && b.category !== filters.category) return false
    return true
  })
})

// 类型筛选变化时，若当前分类不属于该类型则重置
watch(
  () => filters.type,
  (t) => {
    if (t && filters.category && !categories.value.some((c) => c.type === t && c.name === filters.category)) {
      filters.category = ''
    }
  }
)

// ---- 按日期分组 ----
const groupedBills = computed(() => {
  const groups = {}
  filteredBills.value.forEach((b) => {
    if (!groups[b.record_date]) groups[b.record_date] = { list: [], income: 0, expense: 0 }
    groups[b.record_date].list.push(b)
    if (b.type === 'income') groups[b.record_date].income += b.amount
    else groups[b.record_date].expense += b.amount
  })
  return groups
})

// ---- 编辑 ----
const editVisible = ref(false)
const editSubmitting = ref(false)
const editingBill = ref(null)
const editForm = reactive({ type: 'expense', amount: '', category: '', record_date: '', note: '' })

const editCategories = computed(() => categories.value.filter((c) => c.type === editForm.type))

function openEdit(bill) {
  editingBill.value = bill
  editForm.type = bill.type
  editForm.amount = String(bill.amount)
  editForm.category = bill.category
  editForm.record_date = bill.record_date
  editForm.note = bill.note
  editVisible.value = true
}

async function handleEditConfirm() {
  const amountError = validateAmount(editForm.amount)
  if (amountError) return toast(amountError, 'error')
  if (!editForm.category) return toast('请选择分类', 'error')
  if (!editForm.record_date) return toast('请选择记账时间', 'error')

  editSubmitting.value = true
  try {
    await updateBill(editingBill.value.id, {
      type: editForm.type,
      category: editForm.category,
      amount: Number(editForm.amount),
      note: editForm.note,
      record_date: editForm.record_date
    })
    toast('账单已更新', 'success')
    editVisible.value = false
  } catch (e) {
    toast(e?.message || '更新失败，请重试', 'error')
  } finally {
    editSubmitting.value = false
  }
}

// ---- 删除 ----
const deleteVisible = ref(false)
const deletingBill = ref(null)

function openDelete(bill) {
  deletingBill.value = bill
  deleteVisible.value = true
}

async function handleDeleteConfirm() {
  try {
    await deleteBill(deletingBill.value.id)
    toast('账单已删除', 'success')
  } catch (e) {
    toast(e?.message || '删除失败，请重试', 'error')
  }
  deleteVisible.value = false
}

// ---- 清空当月 ----
const showClear = ref(false)
const clearing = ref(false)

async function handleClearMonth() {
  const month = filters.month || formatMonth()
  clearing.value = true
  try {
    await clearMonthBills(month)
    toast(`已清空 ${month} 的账单`, 'success')
    showClear.value = false
  } catch (e) {
    toast(e?.message || '清空失败，请重试', 'error')
  } finally {
    clearing.value = false
  }
}
</script>
