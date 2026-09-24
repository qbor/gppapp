<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:text-2xl">记一笔</h2>
      <p class="mt-1 text-sm text-slate-400">记录你的每一笔收支，养成记账好习惯</p>
    </div>

    <!-- 文字记账（一句话记账） -->
    <div class="card animate-fade-in mb-5 p-4 sm:p-5">
      <label class="label" for="quick-text">✍️ 一句话记账</label>
      <div class="flex gap-2">
        <input
          id="quick-text"
          v-model="quickText"
          class="input flex-1"
          placeholder="例如：今天吃饭花了50、工资到账8000"
          @keyup.enter="parseQuick"
        />
        <button class="btn-secondary shrink-0" @click="parseQuick">解析</button>
      </div>
      <p v-if="quickMsg" class="mt-2 text-xs" :class="quickMsgType === 'error' ? 'text-rose-500' : 'text-ocean-600'">{{ quickMsg }}</p>
    </div>

    <!-- 快捷模板 -->
    <div class="card animate-fade-in mb-5 p-4 sm:p-5">
      <p class="label">⚡ 快捷记账模板</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-900/30"
          @click="fillTemplate(tpl)"
        >
          {{ tpl.name }} {{ currencySymbol }}{{ tpl.amount }}
        </button>
      </div>
    </div>

    <div class="card animate-fade-in p-5 sm:p-8">
      <!-- 收支切换 -->
      <div class="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button class="rounded-xl py-3 text-sm font-semibold transition-all duration-200" :class="form.type === 'expense' ? 'bg-white text-rose-500 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="switchType('expense')">支出</button>
        <button class="rounded-xl py-3 text-sm font-semibold transition-all duration-200" :class="form.type === 'income' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'" @click="switchType('income')">收入</button>
      </div>

      <!-- 金额输入 -->
      <div class="mb-6">
        <label class="label" for="amount">金额</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">{{ currencySymbol }}</span>
          <input id="amount" v-model="form.amount" type="number" min="0" step="0.01" class="input num !py-3 !pl-10 !text-2xl !font-semibold" placeholder="0.00" inputmode="decimal" />
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
            :class="form.category === cat.name ? (cat.type === 'expense' ? 'border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-900/40' : 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/40') : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'"
            @click="form.category = cat.name"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- 账户选择 -->
      <div class="mb-6">
        <label class="label" for="account">账户（钱包）</label>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="acc in accounts"
            :key="acc.id"
            class="rounded-xl border px-2 py-2.5 text-sm font-medium transition-all"
            :class="form.account === acc.name ? 'border-ocean-300 bg-ocean-50 text-ocean-600 dark:bg-ocean-900/40 dark:text-ocean-300' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'"
            @click="form.account = acc.name"
          >
            <span class="mr-1">{{ ACCOUNT_ICONS[acc.icon] || '💰' }}</span>{{ acc.name }}
          </button>
          <button v-if="accounts.length === 0" class="col-span-full rounded-xl border border-dashed border-slate-200 py-2.5 text-sm text-slate-400" disabled>暂无账户，请先在设置页添加</button>
        </div>
      </div>

      <!-- 记账时间 -->
      <div class="mb-6">
        <label class="label" for="record_date">记账时间</label>
        <input id="record_date" v-model="form.record_date" type="date" class="input" :max="formatDate()" />
      </div>

      <!-- 备注 -->
      <div class="mb-6">
        <label class="label" for="note">备注说明</label>
        <input id="note" v-model.trim="form.note" type="text" class="input" maxlength="60" placeholder="选填，如：午餐、地铁充值…" />
      </div>

      <!-- 标签 -->
      <div class="mb-6">
        <label class="label" for="tag-input">标签 <span class="text-xs text-slate-400">（可多个，#外卖 #聚餐）</span></label>
        <div class="flex gap-2">
          <input id="tag-input" v-model="tagInput" class="input flex-1" maxlength="10" placeholder="输入后回车添加" @keyup.enter="addTag" />
          <button class="btn-secondary shrink-0" @click="addTag">添加</button>
        </div>
        <div v-if="form.tags.length" class="mt-2 flex flex-wrap gap-2">
          <span v-for="t in form.tags" :key="t" class="inline-flex items-center gap-1 rounded-lg bg-ocean-50 px-2.5 py-1 text-xs text-ocean-600 dark:bg-ocean-900/40 dark:text-ocean-300">
            #{{ t }}
            <button class="text-ocean-400 hover:text-rose-500" @click="removeTag(t)">✕</button>
          </span>
        </div>
      </div>

      <!-- 凭证图片 -->
      <div class="mb-6">
        <label class="label">消费凭证（截图）</label>
        <div class="flex items-center gap-3">
          <button class="btn-secondary shrink-0" @click="$refs.receiptInput.click()">{{ form.receipt ? '更换图片' : '上传图片' }}</button>
          <input ref="receiptInput" type="file" accept="image/*" class="hidden" @change="handleReceipt" />
          <img v-if="form.receipt" :src="form.receipt" alt="凭证" class="h-14 w-14 rounded-lg object-cover" />
          <button v-if="form.receipt" class="text-xs text-rose-500" @click="form.receipt = ''">移除</button>
        </div>
      </div>

      <!-- 重复账单 -->
      <div class="mb-8">
        <label class="label flex items-center gap-2">
          <input v-model="recurring.enabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
          设为重复账单（周期记账）
        </label>
        <div v-if="recurring.enabled" class="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label" for="rec-freq">重复周期</label>
            <select id="rec-freq" v-model="recurring.frequency" class="input">
              <option value="day">每天</option>
              <option value="week">每周</option>
              <option value="month">每月</option>
            </select>
          </div>
          <div>
            <label class="label" for="rec-date">下次记账日期</label>
            <input id="rec-date" v-model="recurring.next_date" type="date" class="input" :min="formatDate()" />
          </div>
        </div>
      </div>

      <button class="btn-primary w-full !py-3.5 !text-base" :disabled="submitting" @click="handleSubmit">
        <svg v-if="submitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        <span>{{ submitting ? '保存中…' : recurring.enabled ? '保存账单并设置重复' : '保存账单' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { addBill, addRecurring, accounts, categories } from '@/composables/useFinance'
import { toast } from '@/composables/useToast'
import { validateAmount, formatDate, ACCOUNT_ICONS, compressImageToDataUrl } from '@/lib/utils'
import { parseBillText } from '@/lib/parseText'
import { currencySymbol } from '@/composables/useSettings'

// 快捷记账模板
const templates = [
  { name: '早餐', amount: 8, category: '餐饮', type: 'expense', note: '早餐' },
  { name: '午餐', amount: 20, category: '餐饮', type: 'expense', note: '午餐' },
  { name: '通勤', amount: 3, category: '交通', type: 'expense', note: '通勤' },
  { name: '奶茶', amount: 15, category: '餐饮', type: 'expense', note: '奶茶' },
  { name: '水电费', amount: 100, category: '水电', type: 'expense', note: '水电费' },
  { name: '工资', amount: 5000, category: '工资', type: 'income', note: '工资到账' }
]

const form = reactive({
  type: 'expense',
  amount: '',
  category: '',
  account: '',
  record_date: formatDate(),
  note: '',
  tags: [],
  receipt: ''
})

const recurring = reactive({ enabled: false, frequency: 'month', next_date: '' })

const submitting = ref(false)
const tagInput = ref('')
const quickText = ref('')
const quickMsg = ref('')
const quickMsgType = ref('info')

const typeCategories = computed(() => categories.value.filter((c) => c.type === form.type))

function switchType(type) {
  form.type = type
  form.category = ''
}

// ---- 标签 ----
function addTag() {
  const t = tagInput.value.trim().replace(/^#/, '')
  if (!t) return
  if (form.tags.includes(t)) {
    tagInput.value = ''
    return
  }
  if (form.tags.length >= 5) return toast('最多添加 5 个标签', 'error')
  form.tags.push(t)
  tagInput.value = ''
}

function removeTag(t) {
  form.tags = form.tags.filter((x) => x !== t)
}

// ---- 凭证 ----
async function handleReceipt(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return toast('请选择图片文件', 'error')
  try {
    form.receipt = await compressImageToDataUrl(file, 320)
    toast('凭证已添加', 'success')
  } catch {
    toast('图片处理失败，请换一张', 'error')
  } finally {
    e.target.value = ''
  }
}

// ---- 文字记账 ----
function parseQuick() {
  const result = parseBillText(quickText.value)
  if (!result.ok) {
    quickMsgType.value = 'error'
    quickMsg.value = result.error
    return
  }
  form.type = result.type
  form.amount = String(result.amount)
  form.category = result.category
  form.note = result.note || form.note
  quickMsgType.value = 'info'
  quickMsg.value = `已解析：${result.type === 'income' ? '收入' : '支出'} ${currencySymbol.value}${result.amount} · ${result.category}`
  quickText.value = ''
}

// ---- 模板 ----
function fillTemplate(tpl) {
  form.type = tpl.type
  form.amount = String(tpl.amount)
  form.category = tpl.category
  form.note = tpl.note
  toast(`已填充「${tpl.name}」模板`, 'success')
}

// ---- 提交 ----
async function handleSubmit() {
  const amountError = validateAmount(form.amount)
  if (amountError) return toast(amountError, 'error')
  if (!form.category) return toast('请选择收支分类', 'error')
  if (!form.record_date) return toast('请选择记账时间', 'error')
  if (recurring.enabled && !recurring.next_date) return toast('请选择下次记账日期', 'error')

  submitting.value = true
  try {
    await addBill({
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      note: form.note,
      record_date: form.record_date,
      tags: form.tags,
      account: form.account,
      receipt: form.receipt
    })
    if (recurring.enabled) {
      await addRecurring({
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        note: form.note,
        tags: form.tags,
        account: form.account,
        frequency: recurring.frequency,
        next_date: recurring.next_date
      })
    }
    toast(recurring.enabled ? '已保存并设置周期记账' : '记账成功', 'success')
    // 清空表单（保留类型/账户/重复设置）
    form.amount = ''
    form.note = ''
    form.tags = []
    form.receipt = ''
    form.record_date = formatDate()
  } catch (e) {
    toast(e?.message || '保存失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
