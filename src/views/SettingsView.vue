<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">分类与预算</h2>
      <p class="mt-1 text-sm text-slate-400">自定义收支分类，配置月度预算，操作即时生效</p>
    </div>

    <!-- 月度预算 -->
    <div class="card animate-fade-in p-6">
      <div class="mb-4 flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <h3 class="font-medium text-slate-700">月度预算</h3>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="b-month">预算月份</label>
          <input id="b-month" v-model="budgetForm.month" type="month" class="input" />
        </div>
        <div>
          <label class="label" for="b-amount">消费预算（支出）</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
              <input id="b-amount" v-model="budgetForm.amount" type="number" min="0" step="100" class="input num !pl-8" placeholder="如 3000" />
            </div>
            <button class="btn-primary shrink-0" :disabled="budgetSaving" @click="handleSaveBudget">
              {{ budgetSaving ? '保存中…' : '保存' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="currentBudget > 0" class="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M12 12v4" />
        </svg>
        {{ budgetForm.month }} 已设置预算 ¥{{ fmtMoney(currentBudget) }}
      </div>
    </div>

    <!-- 分类管理 -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- 支出分类 -->
      <div class="card animate-fade-in p-6">
        <div class="mb-1 flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </span>
          <h3 class="font-medium text-slate-700">支出分类</h3>
        </div>
        <p class="mb-4 text-xs text-slate-400">预设分类不可删除，可自定义新增、改名</p>

        <ul class="mb-4 space-y-2">
          <li
            v-for="cat in expenseCategories"
            :key="cat.id"
            class="group flex items-center gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-rose-300"></span>
            <template v-if="editingId === cat.id">
              <input
                v-model="editingName"
                class="input !py-1.5"
                maxlength="8"
                @keyup.enter="confirmRename(cat)"
                @keyup.esc="editingId = null"
              />
              <button class="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-600" @click="confirmRename(cat)">保存</button>
            </template>
            <template v-else>
              <span class="flex-1 text-sm text-slate-700">{{ cat.name }}</span>
              <span v-if="cat.is_preset" class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">预设</span>
            </template>
            <div class="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-ocean-50 hover:text-ocean-600" title="重命名" @click="startRename(cat)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button v-if="!cat.is_preset" class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="删除" @click="confirmDeleteCat(cat)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                </svg>
              </button>
            </div>
          </li>
        </ul>

        <div class="flex gap-2">
          <input v-model.trim="expenseNewName" class="input flex-1" maxlength="8" placeholder="新增支出分类" @keyup.enter="addCategoryOf('expense')" />
          <button class="btn-primary shrink-0" :disabled="!expenseNewName" @click="addCategoryOf('expense')">添加</button>
        </div>
      </div>

      <!-- 收入分类 -->
      <div class="card animate-fade-in p-6">
        <div class="mb-1 flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
          <h3 class="font-medium text-slate-700">收入分类</h3>
        </div>
        <p class="mb-4 text-xs text-slate-400">预设分类不可删除，可自定义新增、改名</p>

        <ul class="mb-4 space-y-2">
          <li
            v-for="cat in incomeCategories"
            :key="cat.id"
            class="group flex items-center gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-brand-300"></span>
            <template v-if="editingId === cat.id">
              <input
                v-model="editingName"
                class="input !py-1.5"
                maxlength="8"
                @keyup.enter="confirmRename(cat)"
                @keyup.esc="editingId = null"
              />
              <button class="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-600" @click="confirmRename(cat)">保存</button>
            </template>
            <template v-else>
              <span class="flex-1 text-sm text-slate-700">{{ cat.name }}</span>
              <span v-if="cat.is_preset" class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">预设</span>
            </template>
            <div class="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-ocean-50 hover:text-ocean-600" title="重命名" @click="startRename(cat)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button v-if="!cat.is_preset" class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="删除" @click="confirmDeleteCat(cat)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14" />
                </svg>
              </button>
            </div>
          </li>
        </ul>

        <div class="flex gap-2">
          <input v-model.trim="incomeNewName" class="input flex-1" maxlength="8" placeholder="新增收入分类" @keyup.enter="addCategoryOf('income')" />
          <button class="btn-primary shrink-0" :disabled="!incomeNewName" @click="addCategoryOf('income')">添加</button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card animate-fade-in border-rose-100 p-6">
      <h3 class="mb-1 font-medium text-slate-700">数据管理</h3>
      <p class="mb-4 text-xs text-slate-400">清空本机游客数据（游客模式）/ 清空全部账单与自定义分类并恢复默认（登录模式）</p>
      <button class="btn-danger" @click="showReset = true">重置全部数据</button>
    </div>

    <!-- 删除分类确认 -->
    <AppModal :visible="deleteCatVisible" title="删除分类" confirm-text="删除" @close="deleteCatVisible = false" @confirm="handleDeleteCat">
      <p class="text-sm leading-relaxed text-slate-500">
        确定删除「{{ deletingCat?.name }}」分类吗？已使用该分类的历史账单不会受影响。
      </p>
    </AppModal>

    <!-- 重置确认 -->
    <AppModal :visible="showReset" title="重置全部数据" confirm-text="确认重置" @close="showReset = false" @confirm="handleReset">
      <p class="text-sm leading-relaxed text-slate-500">
        此操作将清空{{ isLoggedIn ? '你的全部账单、自定义分类与预算' : '本机的游客数据' }}，并恢复默认预设分类，<b class="text-rose-500">不可恢复</b>，请谨慎操作。
      </p>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  categories,
  budgets,
  addCategory,
  updateCategory,
  deleteCategory,
  setBudget,
  resetUserData
} from '@/composables/useFinance'
import { isLoggedIn } from '@/composables/useAuth'
import { toast } from '@/composables/useToast'
import AppModal from '@/components/AppModal.vue'
import { fmtMoney, formatMonth } from '@/lib/utils'

const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))
const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'))

// ---- 预算 ----
const budgetForm = reactive({ month: formatMonth(), amount: '' })
const budgetSaving = ref(false)

const currentBudget = computed(() => Number(budgets.value[budgetForm.month] || 0))

async function handleSaveBudget() {
  const amount = Number(budgetForm.amount)
  if (!budgetForm.month) return toast('请选择预算月份', 'error')
  if (!budgetForm.amount || amount < 0) return toast('请输入有效的预算金额（不能为负数）', 'error')

  budgetSaving.value = true
  try {
    await setBudget(budgetForm.month, amount)
    toast(`已保存 ${budgetForm.month} 的预算`, 'success')
    budgetForm.amount = ''
  } catch (e) {
    toast(e?.message || '保存失败，请重试', 'error')
  } finally {
    budgetSaving.value = false
  }
}

// ---- 分类新增 ----
const expenseNewName = ref('')
const incomeNewName = ref('')

async function addCategoryOf(type) {
  const name = (type === 'expense' ? expenseNewName.value : incomeNewName.value).trim()
  if (!name) return toast('请输入分类名称', 'error')
  const exist = categories.value.some((c) => c.type === type && c.name === name)
  if (exist) return toast('该分类已存在', 'error')

  try {
    await addCategory({ name, type })
    toast(`已添加「${name}」`, 'success')
    if (type === 'expense') expenseNewName.value = ''
    else incomeNewName.value = ''
  } catch (e) {
    toast(e?.message || '添加失败，请重试', 'error')
  }
}

// ---- 分类重命名 ----
const editingId = ref(null)
const editingName = ref('')

function startRename(cat) {
  editingId.value = cat.id
  editingName.value = cat.name
}

async function confirmRename(cat) {
  const name = editingName.value.trim()
  if (!name) return toast('分类名称不能为空', 'error')
  const exist = categories.value.some((c) => c.type === cat.type && c.name === name && c.id !== cat.id)
  if (exist) return toast('该分类已存在', 'error')

  try {
    await updateCategory(cat.id, name)
    toast('分类已重命名', 'success')
    editingId.value = null
  } catch (e) {
    toast(e?.message || '重命名失败，请重试', 'error')
  }
}

// ---- 分类删除 ----
const deleteCatVisible = ref(false)
const deletingCat = ref(null)

function confirmDeleteCat(cat) {
  deletingCat.value = cat
  deleteCatVisible.value = true
}

async function handleDeleteCat() {
  try {
    await deleteCategory(deletingCat.value.id)
    toast(`已删除「${deletingCat.value.name}」`, 'success')
  } catch (e) {
    toast(e?.message || '删除失败，请重试', 'error')
  }
  deleteCatVisible.value = false
}

// ---- 重置 ----
const showReset = ref(false)
const resetting = ref(false)

async function handleReset() {
  resetting.value = true
  try {
    await resetUserData()
    toast(isLoggedIn.value ? '云端数据已重置' : '本机数据已重置', 'success')
    showReset.value = false
  } catch (e) {
    toast(e?.message || '重置失败，请重试', 'error')
  } finally {
    resetting.value = false
  }
}
</script>
