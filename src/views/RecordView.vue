<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-slate-800 sm:text-2xl">记一笔</h2>
      <p class="mt-1 text-sm text-slate-400">记录你的每一笔收支，养成记账好习惯</p>
    </div>

    <div class="card animate-fade-in p-5 sm:p-8">
      <!-- 收支切换 -->
      <div class="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5">
        <button
          class="rounded-xl py-3 text-sm font-semibold transition-all duration-200"
          :class="form.type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="switchType('expense')"
        >
          支出
        </button>
        <button
          class="rounded-xl py-3 text-sm font-semibold transition-all duration-200"
          :class="form.type === 'income' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="switchType('income')"
        >
          收入
        </button>
      </div>

      <!-- 金额输入 -->
      <div class="mb-6">
        <label class="label" for="amount">金额</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">¥</span>
          <input
            id="amount"
            v-model="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="input num !py-3 !pl-10 !text-2xl !font-semibold"
            placeholder="0.00"
            inputmode="decimal"
          />
        </div>
      </div>

      <!-- 分类选择 -->
      <div class="mb-6">
        <label class="label">分类</label>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button
            v-for="cat in typeCategories"
            :key="cat.id"
            class="rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-200"
            :class="
              form.category === cat.name
                ? cat.type === 'expense'
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
            "
            @click="form.category = cat.name"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- 记账时间 -->
      <div class="mb-6">
        <label class="label" for="record_date">记账时间</label>
        <input id="record_date" v-model="form.record_date" type="date" class="input" :max="formatDate()" />
      </div>

      <!-- 备注 -->
      <div class="mb-8">
        <label class="label" for="note">备注说明</label>
        <input id="note" v-model.trim="form.note" type="text" class="input" maxlength="60" placeholder="选填，如：午餐、地铁充值…" />
      </div>

      <button class="btn-primary w-full !py-3.5 !text-base" :disabled="submitting" @click="handleSubmit">
        <svg v-if="submitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        <span>{{ submitting ? '保存中…' : '保存账单' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { addBill, categories } from '@/composables/useFinance'
import { toast } from '@/composables/useToast'
import { validateAmount, formatDate } from '@/lib/utils'

const form = reactive({
  type: 'expense', // 默认选中支出
  amount: '',
  category: '',
  record_date: formatDate(),
  note: ''
})

const submitting = ref(false)
const typeCategories = computed(() => categories.value.filter((c) => c.type === form.type))

function switchType(type) {
  form.type = type
  // 切换类型后重置分类，避免跨类型残留
  form.category = ''
}

async function handleSubmit() {
  const amountError = validateAmount(form.amount)
  if (amountError) {
    toast(amountError, 'error')
    return
  }
  if (!form.category) {
    toast('请选择收支分类', 'error')
    return
  }
  if (!form.record_date) {
    toast('请选择记账时间', 'error')
    return
  }

  submitting.value = true
  try {
    await addBill({
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      note: form.note,
      record_date: form.record_date
    })
    toast('记账成功', 'success')
    // 清空金额与备注，保留类型与日期便于连续记账
    form.amount = ''
    form.note = ''
    form.record_date = formatDate()
  } catch (e) {
    toast(e?.message || '保存失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
