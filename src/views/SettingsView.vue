<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 sm:text-2xl">设置</h2>
      <p class="mt-1 text-sm text-slate-400">账户、钱包、分类预算、主题与数据管理</p>
    </div>

    <!-- 个人资料 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">👤 个人资料</h3>
      <div class="flex items-center gap-4">
        <div class="relative">
          <img v-if="avatarPreview" :src="avatarPreview" alt="头像" class="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900/50" />
          <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-ocean-400 text-xl font-semibold text-white">
            {{ displayName.slice(0, 1) }}
          </div>
          <button class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:text-brand-500" title="上传头像" @click="$refs.avatarInput.click()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          </button>
          <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatar" />
        </div>
        <div class="flex-1 space-y-2">
          <input v-model="profileForm.nickname" type="text" class="input" maxlength="20" placeholder="设置你的昵称" />
          <div class="flex items-center gap-2">
            <button class="btn-primary shrink-0" :disabled="profileSaving" @click="handleSaveProfile">{{ profileSaving ? '保存中…' : '保存资料' }}</button>
            <span v-if="isLoggedIn" class="text-xs text-slate-400">已登录：{{ userEmail }}</span>
            <span v-else class="text-xs text-slate-400">游客模式（数据仅存本机）</span>
          </div>
        </div>
      </div>

      <!-- 登录用户：密码重置 -->
      <div v-if="isLoggedIn" class="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
        <p class="text-sm text-slate-600 dark:text-slate-300">忘记密码？发送重置邮件到当前邮箱，点击邮件中的链接即可重置。</p>
        <button class="btn-secondary mt-2.5" :disabled="resetSending" @click="handleResetPassword">{{ resetSending ? '发送中…' : '发送密码重置邮件' }}</button>
      </div>
    </div>

    <!-- 外观 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">🎨 外观与货币</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="label">主题模式</p>
          <button class="btn-secondary w-full" @click="toggleTheme">
            <span v-if="theme === 'light'">🌙 切换到暗色模式</span>
            <span v-else>☀️ 切换到亮色模式</span>
          </button>
        </div>
        <div>
          <p class="label">货币单位</p>
          <div class="grid grid-cols-5 gap-1.5">
            <button
              v-for="sym in ['¥', '$', '€', '£', '₩']"
              :key="sym"
              class="rounded-lg border py-2 text-sm font-semibold transition-all"
              :class="currencySymbol === sym ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'"
              @click="setCurrency(sym)"
            >
              {{ sym }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 账户管理 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-medium text-slate-700 dark:text-slate-200">💰 钱包账户管理</h3>
        <button class="btn-secondary" @click="openAddAccount">＋ 新增账户</button>
      </div>
      <div v-if="accounts.length" class="mb-3 grid gap-3 sm:grid-cols-2">
        <div v-for="acc in accounts" :key="acc.id" class="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-700">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-xl dark:bg-slate-800">{{ ACCOUNT_ICONS[acc.icon] || '💰' }}</span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ acc.name }}</p>
            <p class="num text-sm text-slate-500 dark:text-slate-400">{{ currencySymbol }}{{ fmtMoney(acc.balance) }}</p>
          </div>
          <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-ocean-600 dark:hover:bg-slate-800" title="编辑" @click="openEditAccount(acc)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          </button>
          <button class="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30" title="删除" @click="openDeleteAccount(acc)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" /></svg>
          </button>
        </div>
      </div>
      <p v-else class="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
        还没有钱包账户。注册用户会自动创建「现金 / 微信 / 支付宝 / 银行卡」4 个默认账户，游客可手动添加。
      </p>
      <div v-if="accounts.length" class="rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60">
        <span class="text-slate-500 dark:text-slate-400">总资产：</span>
        <span class="num font-bold text-slate-800 dark:text-slate-100">{{ currencySymbol }}{{ fmtMoney(totalAssets) }}</span>
      </div>
    </div>

    <!-- 分类与预算 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">📋 分类与预算</h3>

      <!-- 月度总预算 -->
      <div class="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="b-month">预算月份</label>
          <input id="b-month" v-model="budgetForm.month" type="month" class="input" />
        </div>
        <div>
          <label class="label" for="b-amount">本月消费总预算</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{{ currencySymbol }}</span>
              <input id="b-amount" v-model="budgetForm.amount" type="number" min="0" step="100" class="input num !pl-8" placeholder="如 3000" />
            </div>
            <button class="btn-primary shrink-0" :disabled="budgetSaving" @click="handleSaveBudget">{{ budgetSaving ? '保存中…' : '保存' }}</button>
          </div>
        </div>
      </div>

      <div v-if="currentBudget > 0" class="mb-5 rounded-xl px-4 py-3 text-sm" :class="overBudget ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30'">
        本月预算 <b class="num">{{ currencySymbol }}{{ fmtMoney(currentBudget) }}</b>，已花 <b class="num">{{ currencySymbol }}{{ fmtMoney(monthSpent) }}</b>
        <span v-if="overBudget">，<b>已超支 {{ currencySymbol }}{{ fmtMoney(monthSpent - currentBudget) }}</b>，注意控制消费！</span>
        <span v-else-if="budgetPercent >= 80">，已用 <b>{{ Math.round(budgetPercent) }}%</b>，接近预算上限 ⚠️</span>
        <span v-else>，剩余 {{ currencySymbol }}{{ fmtMoney(currentBudget - monthSpent) }}</span>
      </div>

      <!-- 分类预算进度 -->
      <div class="mb-5">
        <p class="label">分类预算进度（{{ budgetForm.month }}）</p>
        <div v-if="categoryBudgetList.length" class="space-y-3">
          <div v-for="cb in categoryBudgetList" :key="`${cb.month}-${cb.category}`" class="rounded-xl border border-slate-100 p-3.5 dark:border-slate-700">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="font-medium text-slate-700 dark:text-slate-200">{{ cb.category }}</span>
              <span class="num text-xs" :class="cb.percent >= 100 ? 'font-bold text-rose-600' : cb.percent >= 80 ? 'font-semibold text-amber-600' : 'text-slate-400'">
                {{ currencySymbol }}{{ fmtMoney(cb.spent) }} / {{ currencySymbol }}{{ fmtMoney(cb.amount) }}（{{ Math.round(cb.percent) }}%）
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-full rounded-full transition-all duration-500" :class="cb.percent >= 100 ? 'bg-rose-400' : cb.percent >= 80 ? 'bg-amber-400' : 'bg-brand-400'" :style="{ width: `${Math.min(100, cb.percent)}%` }"></div>
            </div>
            <p v-if="cb.percent >= 100" class="mt-1.5 text-xs font-medium text-rose-500">🚨 该分类已超预算！</p>
            <p v-else-if="cb.percent >= 80" class="mt-1.5 text-xs font-medium text-amber-600">⚠️ 已使用 80% 以上，注意控制</p>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">还没有设置分类预算。在下方为某个分类输入预算金额，即可开启进度监控。</p>
      </div>

      <!-- 自定义分类 -->
      <div class="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
        <p class="label">自定义收支分类</p>
        <div class="mb-3 flex gap-2">
          <input v-model.trim="categoryForm.name" type="text" class="input flex-1" maxlength="6" placeholder="分类名称，如：宠物" />
          <select v-model="categoryForm.type" class="input w-28">
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          <button class="btn-primary shrink-0" :disabled="categorySaving" @click="handleAddCategory">添加</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="cat in categories"
            :key="cat.id"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
            :class="cat.type === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30'"
          >
            {{ cat.name }}
            <button class="text-slate-400 hover:text-rose-500" title="删除" @click="handleDeleteCategory(cat)">✕</button>
          </span>
        </div>
        <p class="mt-3 text-xs text-slate-400">预设分类和带账单的分类不可删除；自定义分类可直接删除。</p>
      </div>
    </div>

    <!-- 周期记账管理 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">🔁 周期记账（重复账单）</h3>
      <ul v-if="recurringBills.length" class="space-y-2">
        <li v-for="r in recurringBills" :key="r.id" class="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-3 dark:border-slate-700">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ r.category }} <span class="num">¥{{ fmtMoney(r.amount) }}</span></p>
            <p class="text-xs text-slate-400">每{{ FREQ_LABEL[r.frequency] }} · 下次 {{ r.next_date }}{{ r.enabled ? '' : '（已暂停）' }}</p>
          </div>
          <button class="shrink-0 rounded-lg px-3 py-1.5 text-sm" :class="r.enabled ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40'" @click="handleToggleRecurring(r)">{{ r.enabled ? '暂停' : '启用' }}</button>
          <button class="shrink-0 rounded-lg px-3 py-1.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30" @click="handleDeleteRecurring(r)">删除</button>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-400">暂无周期账单。记账时勾选「设为重复账单」即可创建，如房租、话费。</p>
    </div>

    <!-- 数据备份与恢复 -->
    <div class="card animate-fade-in p-5 sm:p-6">
      <h3 class="mb-4 font-medium text-slate-700 dark:text-slate-200">💾 数据备份与恢复</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <button class="btn-secondary" @click="handleExportBackup">⬇️ 导出备份文件（JSON）</button>
        <button class="btn-secondary" @click="$refs.backupInput.click()">⬆️ 从备份文件恢复</button>
        <input ref="backupInput" type="file" accept=".json,application/json" class="hidden" @change="handleImportBackup" />
      </div>
      <p class="mt-3 text-xs leading-relaxed text-slate-400">
        {{ isLoggedIn ? '登录用户的数据存储在 Supabase 云端；导出备份可用于数据迁移与存档。' : '游客模式数据仅保存在本机浏览器，请定期导出备份，避免清除浏览器数据后丢失！' }}
      </p>
    </div>

    <!-- 危险操作 -->
    <div class="card animate-fade-in border-rose-100 p-5 sm:p-6 dark:border-rose-900/40">
      <h3 class="mb-2 font-medium text-rose-600">⚠️ 危险操作</h3>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn-danger" @click="resetVisible = true">重置全部数据</button>
        <span class="text-xs text-slate-400">{{ isLoggedIn ? '将清空云端所有账单、分类、预算、账户、债务等数据（不含账号）' : '将清空本机全部记账数据' }}</span>
      </div>
    </div>

    <!-- 账户弹窗 -->
    <AppModal :visible="accountModal.visible" :title="accountModal.id ? '编辑账户' : '新增账户'" :confirm-disabled="accountSaving" @close="accountModal.visible = false" @confirm="handleAccountConfirm">
      <div class="space-y-4">
        <div>
          <label class="label" for="acc-name">账户名称</label>
          <input id="acc-name" v-model="accountModal.name" type="text" class="input" maxlength="10" placeholder="如：现金、微信、银行卡" />
        </div>
        <div>
          <label class="label">图标</label>
          <div class="grid grid-cols-4 gap-2">
            <button v-for="(ic, key) in ACCOUNT_ICONS" :key="key" class="rounded-xl border py-2 text-xl transition-all" :class="accountModal.icon === key ? 'border-ocean-300 bg-ocean-50 dark:bg-ocean-900/40' : 'border-slate-200 dark:border-slate-700'" @click="accountModal.icon = key">{{ ic }}</button>
          </div>
        </div>
        <div>
          <label class="label" for="acc-balance">当前余额</label>
          <input id="acc-balance" v-model="accountModal.balance" type="number" min="0" step="0.01" class="input num" placeholder="0.00" />
        </div>
      </div>
    </AppModal>

    <!-- 删除账户确认 -->
    <AppModal :visible="deleteAccountVisible" title="删除账户" confirm-text="删除" @close="deleteAccountVisible = false" @confirm="handleDeleteAccountConfirm">
      <p class="text-sm leading-relaxed text-slate-500">确定删除账户「{{ deletingAccount?.name }}」吗？该账户余额不会自动转移到其他账户，历史账单中的账户标记会保留。</p>
    </AppModal>

    <!-- 重置确认 -->
    <AppModal :visible="resetVisible" title="重置全部数据" confirm-text="确认重置" :confirm-disabled="resetting" @close="resetVisible = false" @confirm="handleResetConfirm">
      <p class="text-sm leading-relaxed text-slate-500">
        此操作将<b class="text-rose-500">彻底删除</b>全部账单、分类、预算、账户、周期账单与债务数据，且<b>不可恢复</b>。确定继续吗？
      </p>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  categories, accounts, recurringBills, budgets, bills, categoryBudgets,
  addCategory, deleteCategory, setBudget, setCategoryBudget,
  addAccount, updateAccount, deleteAccount,
  toggleRecurring, deleteRecurring,
  saveProfile, exportBackup, importBackup, resetUserData, resetLocalData
} from '@/composables/useFinance'
import { theme, currencySymbol, toggleTheme, setCurrency, saveProfile as saveSettingsProfile, displayName, nickname, avatarUrl } from '@/composables/useSettings'
import { isLoggedIn, userEmail, resetPassword } from '@/composables/useAuth'
import { toast } from '@/composables/useToast'
import AppModal from '@/components/AppModal.vue'
import { ACCOUNT_ICONS, fmtMoney, formatMonth, compressImageToDataUrl } from '@/lib/utils'
import { monthStats } from '@/composables/useStats'
import { downloadJsonFile, readFileAsJson } from '@/lib/csv'

const FREQ_LABEL = { day: '天', week: '周', month: '月' }

// ---- 个人资料 ----
const profileForm = reactive({ nickname: '' })
const avatarPreview = ref('')
const profileSaving = ref(false)
const resetSending = ref(false)

// 初始化昵称/头像（显示用）
profileForm.nickname = nickname.value
avatarPreview.value = avatarUrl.value

async function handleAvatar(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return toast('请选择图片文件', 'error')
  try {
    avatarPreview.value = await compressImageToDataUrl(file, 128)
    toast('头像已选择，点「保存资料」生效', 'success')
  } catch {
    toast('图片处理失败', 'error')
  } finally {
    e.target.value = ''
  }
}

async function handleSaveProfile() {
  profileSaving.value = true
  try {
    saveSettingsProfile({ nickname: profileForm.nickname.trim(), avatarUrl: avatarPreview.value })
    if (isLoggedIn.value) {
      await saveProfile({ nickname: profileForm.nickname.trim(), avatarUrl: avatarPreview.value })
    }
    toast('资料已保存', 'success')
  } catch (err) {
    toast(err?.message || '保存失败', 'error')
  } finally {
    profileSaving.value = false
  }
}

async function handleResetPassword() {
  resetSending.value = true
  try {
    await resetPassword(userEmail.value)
    toast('重置邮件已发送，请查收', 'success')
  } catch (err) {
    toast(err?.message || '发送失败，稍后再试', 'error')
  } finally {
    resetSending.value = false
  }
}

// ---- 账户管理 ----
const accountModal = reactive({ visible: false, id: null, name: '', icon: 'other', balance: 0 })
const accountSaving = ref(false)
const deleteAccountVisible = ref(false)
const deletingAccount = ref(null)

const totalAssets = computed(() => accounts.value.reduce((s, a) => s + Number(a.balance || 0), 0))

function openAddAccount() {
  accountModal.id = null
  accountModal.name = ''
  accountModal.icon = 'other'
  accountModal.balance = 0
  accountModal.visible = true
}

function openEditAccount(acc) {
  accountModal.id = acc.id
  accountModal.name = acc.name
  accountModal.icon = acc.icon
  accountModal.balance = acc.balance
  accountModal.visible = true
}

async function handleAccountConfirm() {
  if (!accountModal.name.trim()) return toast('请输入账户名称', 'error')
  accountSaving.value = true
  try {
    if (accountModal.id) {
      await updateAccount(accountModal.id, { name: accountModal.name.trim(), icon: accountModal.icon, balance: Number(accountModal.balance) })
      toast('账户已更新', 'success')
    } else {
      await addAccount({ name: accountModal.name.trim(), icon: accountModal.icon, balance: Number(accountModal.balance) })
      toast('账户已添加', 'success')
    }
    accountModal.visible = false
  } catch (err) {
    toast(err?.message || '保存失败', 'error')
  } finally {
    accountSaving.value = false
  }
}

function openDeleteAccount(acc) {
  deletingAccount.value = acc
  deleteAccountVisible.value = true
}

async function handleDeleteAccountConfirm() {
  try {
    await deleteAccount(deletingAccount.value.id)
    toast('账户已删除', 'success')
  } catch (err) {
    toast(err?.message || '删除失败', 'error')
  }
  deleteAccountVisible.value = false
}

// ---- 分类与预算 ----
const budgetForm = reactive({ month: formatMonth(), amount: '' })
const budgetSaving = ref(false)

const currentBudget = computed(() => Number(budgets.value[budgetForm.month] || 0))
const monthSpent = computed(() => monthStats(bills.value, budgetForm.month).expense)
const budgetPercent = computed(() => (currentBudget.value > 0 ? (monthSpent.value / currentBudget.value) * 100 : 0))
const overBudget = computed(() => currentBudget.value > 0 && monthSpent.value > currentBudget.value)

async function handleSaveBudget() {
  const amount = Number(budgetForm.amount)
  if (!amount || amount <= 0) return toast('请输入有效的预算金额', 'error')
  budgetSaving.value = true
  try {
    await setBudget(budgetForm.month, amount)
    toast('预算已保存', 'success')
  } catch (err) {
    toast(err?.message || '保存失败', 'error')
  } finally {
    budgetSaving.value = false
  }
}

// 分类预算（当月）
const categoryBudgetList = computed(() => {
  const list = []
  const spentMap = {}
  bills.value
    .filter((b) => b.type === 'expense' && b.record_date.startsWith(budgetForm.month))
    .forEach((b) => {
      spentMap[b.category] = (spentMap[b.category] || 0) + b.amount
    })
  for (const [key, amount] of Object.entries(categoryBudgets.value)) {
    const [month, category] = key.split('|')
    if (month !== budgetForm.month) continue
    const spent = spentMap[category] || 0
    list.push({ month, category, amount, spent, percent: amount > 0 ? (spent / amount) * 100 : 0 })
  }
  return list.sort((a, b) => b.percent - a.percent)
})

// 自定义分类
const categoryForm = reactive({ name: '', type: 'expense' })
const categorySaving = ref(false)

async function handleAddCategory() {
  if (!categoryForm.name.trim()) return toast('请输入分类名称', 'error')
  categorySaving.value = true
  try {
    await addCategory({ name: categoryForm.name.trim(), type: categoryForm.type })
    toast('分类已添加', 'success')
    categoryForm.name = ''
  } catch (err) {
    toast(err?.message || '添加失败', 'error')
  } finally {
    categorySaving.value = false
  }
}

async function handleDeleteCategory(cat) {
  try {
    await deleteCategory(cat.id)
    toast('分类已删除', 'success')
  } catch (err) {
    toast(err?.message || '删除失败', 'error')
  }
}

// ---- 周期记账 ----
async function handleToggleRecurring(r) {
  try {
    await toggleRecurring(r.id)
    toast(r.enabled ? '已暂停该周期账单' : '已启用该周期账单', 'success')
  } catch (err) {
    toast(err?.message || '操作失败', 'error')
  }
}

async function handleDeleteRecurring(r) {
  try {
    await deleteRecurring(r.id)
    toast('周期账单已删除', 'success')
  } catch (err) {
    toast(err?.message || '删除失败', 'error')
  }
}

// ---- 备份与恢复 ----
function handleExportBackup() {
  try {
    const data = exportBackup()
    downloadJsonFile(`快计备份_${formatMonth()}.json`, data)
    toast('备份文件已导出', 'success')
  } catch (err) {
    toast(err?.message || '导出失败', 'error')
  }
}

async function handleImportBackup(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const data = await readFileAsJson(file)
    await importBackup(data)
    toast('备份恢复成功，页面即将刷新', 'success')
    setTimeout(() => location.reload(), 800)
  } catch (err) {
    toast(err?.message || '恢复失败，请检查备份文件', 'error')
  } finally {
    e.target.value = ''
  }
}

// ---- 重置 ----
const resetVisible = ref(false)
const resetting = ref(false)

async function handleResetConfirm() {
  resetting.value = true
  try {
    if (isLoggedIn.value) {
      await resetUserData()
    } else {
      resetLocalData()
    }
    toast('数据已重置', 'success')
    setTimeout(() => location.reload(), 800)
  } catch (err) {
    toast(err?.message || '重置失败', 'error')
  } finally {
    resetting.value = false
  }
}
</script>
