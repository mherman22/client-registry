<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-carbon-900 mb-1">User Management</h1>
      <p class="text-sm text-carbon-500">Manage system users, roles, and passwords</p>
    </div>

    <!-- Search + Add Button -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        v-model="search"
        class="flex-1 max-w-xs h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
        placeholder="Search users..."
      />
      <button
        class="h-10 px-4 text-sm font-medium"
        :class="showAddForm ? 'border border-carbon-300 text-carbon-700 hover:bg-carbon-50' : 'bg-blue-600 text-white hover:bg-blue-700'"
        @click="showAddForm = !showAddForm"
      >
        {{ showAddForm ? 'Cancel' : 'Add User' }}
      </button>
    </div>

    <!-- Add User Form -->
    <div v-if="showAddForm" class="bg-white border border-carbon-100 p-5 mb-6">
      <h2 class="text-lg font-semibold text-carbon-900 mb-4">Add New User</h2>
      <form class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" @submit.prevent="addUser">
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">First Name *</label>
          <input
            v-model="newUser.firstName"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Surname *</label>
          <input
            v-model="newUser.surname"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Username *</label>
          <input
            v-model="newUser.userName"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Role *</label>
          <select
            v-model="newUser.role"
            class="h-10 px-3 text-sm border border-carbon-300 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          >
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="deduplication">Deduplication</option>
          </select>
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Password *</label>
          <input
            v-model="newUser.password"
            type="password"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Confirm Password *</label>
          <input
            v-model="newUser.confirmPassword"
            type="password"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
          <button
            type="submit"
            class="h-10 px-4 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : 'Create User' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Change Password Form -->
    <div v-if="changingPwFor" class="bg-white border border-carbon-100 p-5 mb-6">
      <h2 class="text-lg font-semibold text-carbon-900 mb-4">Change Password for {{ changingPwFor.userName }}</h2>
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="changePassword">
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">New Password *</label>
          <input
            v-model="pwForm.newpassword"
            type="password"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-medium text-carbon-600 mb-1">Confirm Password *</label>
          <input
            v-model="pwForm.confirmPassword"
            type="password"
            class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            required
          />
        </div>
        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="h-10 px-4 border border-carbon-300 text-carbon-700 text-sm hover:bg-carbon-50"
            @click="changingPwFor = null"
          >Cancel</button>
          <button
            type="submit"
            class="h-10 px-4 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Users Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-xs uppercase text-carbon-500 bg-carbon-50 border-b border-carbon-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-carbon-900" @click="sortBy('userName')">
              Username
              <span v-if="sortKey === 'userName'" class="ml-1 text-blue-600">{{ sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th class="px-4 py-3 text-left font-medium">Name</th>
            <th class="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-carbon-900" @click="sortBy('role')">
              Role
              <span v-if="sortKey === 'role'" class="ml-1 text-blue-600">{{ sortAsc ? '↑' : '↓' }}</span>
            </th>
            <th class="px-4 py-3 text-left font-medium">Status</th>
            <th class="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <tr v-if="loadingUsers">
            <td :colspan="5" class="px-4 py-16 text-center">
              <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p class="text-sm text-carbon-400">Loading users...</p>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="filteredUsers.length === 0">
            <td :colspan="5" class="px-4 py-16 text-center">
              <div class="text-carbon-300 mb-3">
                <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-carbon-500">No users found</h3>
              <p class="text-sm text-carbon-400">Add a user to get started</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-for="user in sortedUsers"
            :key="user.id || user.userName"
            class="border-b border-carbon-100 hover:bg-carbon-50"
          >
            <td class="px-4 py-3 font-medium text-carbon-900">{{ user.userName }}</td>
            <td class="px-4 py-3 text-carbon-600">{{ user.firstName }} {{ user.surname }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'"
              >{{ user.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-carbon-100 text-carbon-600'"
              >{{ user.status }}</span>
            </td>
            <td class="px-4 py-3">
              <button
                class="text-sm text-blue-600 hover:underline"
                @click="changingPwFor = user"
              >Change Password</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const app = useAppStore()
const auth = useAuthStore()

const users = ref([])
const search = ref('')
const loadingUsers = ref(false)
const sortKey = ref('')
const sortAsc = ref(true)
const saving = ref(false)
const showAddForm = ref(false)
const changingPwFor = ref(null)

const newUser = ref({ firstName: '', surname: '', userName: '', role: '', password: '', confirmPassword: '' })
const pwForm = ref({ newpassword: '', confirmPassword: '' })

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const s = search.value.toLowerCase()
  return users.value.filter(u =>
    (u.userName && u.userName.toLowerCase().includes(s)) ||
    (u.firstName && u.firstName.toLowerCase().includes(s)) ||
    (u.surname && u.surname.toLowerCase().includes(s)) ||
    (u.role && u.role.toLowerCase().includes(s))
  )
})

function sortBy(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedUsers = computed(() => {
  if (!sortKey.value) return filteredUsers.value
  return [...filteredUsers.value].sort((a, b) => {
    const va = (a[sortKey.value] || '').toString().toLowerCase()
    const vb = (b[sortKey.value] || '').toString().toLowerCase()
    if (va < vb) return sortAsc.value ? -1 : 1
    if (va > vb) return sortAsc.value ? 1 : -1
    return 0
  })
})

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const res = await axios.get('/ocrux/user/getUsers/')
    users.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch users', e)
  }
  loadingUsers.value = false
}

async function addUser() {
  if (newUser.value.password !== newUser.value.confirmPassword) {
    app.showNotification('error', 'Password mismatch', 'Passwords do not match')
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('firstName', newUser.value.firstName)
    formData.append('surname', newUser.value.surname)
    formData.append('userName', newUser.value.userName)
    formData.append('role', newUser.value.role)
    formData.append('password', newUser.value.password)
    await axios.post('/ocrux/user/addUser/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    app.showNotification('success', 'User created successfully')
    newUser.value = { firstName: '', surname: '', userName: '', role: '', password: '', confirmPassword: '' }
    showAddForm.value = false
    await fetchUsers()
  } catch (e) {
    app.showNotification('error', 'Failed to add user', e.response?.data?.message || 'Username may already exist')
  }
  saving.value = false
}

async function changePassword() {
  if (pwForm.value.newpassword !== pwForm.value.confirmPassword) {
    app.showNotification('error', 'Password mismatch', 'Passwords do not match')
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('username', changingPwFor.value.userName)
    formData.append('newpassword', pwForm.value.newpassword)
    await axios.post('/ocrux/user/changepassword/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    app.showNotification('success', 'Password changed successfully')
    changingPwFor.value = null
    pwForm.value = { newpassword: '', confirmPassword: '' }
  } catch (e) {
    app.showNotification('error', 'Failed to change password', e.response?.data || e.message)
  }
  saving.value = false
}

onMounted(fetchUsers)
</script>

<style scoped>
</style>
