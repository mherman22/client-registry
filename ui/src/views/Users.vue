<template>
  <div class="content-area">
    <div class="page-header">
      <h1>User Management</h1>
      <p>Manage system users, roles, and passwords</p>
    </div>

    <div class="filter-row">
      <input v-model="search" class="bx--text-input bx--search-input" placeholder="Search users..." />
      <button class="bx--btn bx--btn--primary bx--btn--sm" @click="showAddForm = !showAddForm">
        {{ showAddForm ? 'Cancel' : 'Add User' }}
      </button>
    </div>

    <!-- Add User Form -->
    <div v-if="showAddForm" class="detail-section">
      <h3>Add New User</h3>
      <form class="form-grid" @submit.prevent="addUser">
        <div class="form-field">
          <label class="bx--label">First Name *</label>
          <input v-model="newUser.firstName" class="bx--text-input" required />
        </div>
        <div class="form-field">
          <label class="bx--label">Surname *</label>
          <input v-model="newUser.surname" class="bx--text-input" required />
        </div>
        <div class="form-field">
          <label class="bx--label">Username *</label>
          <input v-model="newUser.userName" class="bx--text-input" required />
        </div>
        <div class="form-field">
          <label class="bx--label">Role *</label>
          <select v-model="newUser.role" class="bx--select-input" required>
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="deduplication">Deduplication</option>
          </select>
        </div>
        <div class="form-field">
          <label class="bx--label">Password *</label>
          <input v-model="newUser.password" type="password" class="bx--text-input" required />
        </div>
        <div class="form-field">
          <label class="bx--label">Confirm Password *</label>
          <input v-model="newUser.confirmPassword" type="password" class="bx--text-input" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="bx--btn bx--btn--primary bx--btn--sm" :disabled="saving">
            {{ saving ? 'Saving...' : 'Create User' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Change Password -->
    <div v-if="changingPwFor" class="detail-section">
      <h3>Change Password for {{ changingPwFor.userName }}</h3>
      <form class="form-grid" @submit.prevent="changePassword">
        <div class="form-field">
          <label class="bx--label">New Password *</label>
          <input v-model="pwForm.newpassword" type="password" class="bx--text-input" required />
        </div>
        <div class="form-field">
          <label class="bx--label">Confirm Password *</label>
          <input v-model="pwForm.confirmPassword" type="password" class="bx--text-input" required />
        </div>
        <div class="form-actions">
          <button type="button" class="bx--btn bx--btn--ghost bx--btn--sm" @click="changingPwFor = null">Cancel</button>
          <button type="submit" class="bx--btn bx--btn--primary bx--btn--sm" :disabled="saving">
            {{ saving ? 'Saving...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Users Table -->
    <div v-if="loadingUsers" class="empty-state"><p>Loading users...</p></div>

    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <h3>No users found</h3>
    </div>

    <div v-else class="data-table-container">
      <table class="bx--data-table bx--data-table-v2">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id || user.userName">
            <td>{{ user.userName }}</td>
            <td>{{ user.firstName }} {{ user.surname }}</td>
            <td>
              <span class="bx--tag" :class="user.role === 'admin' ? 'bx--tag--blue' : 'bx--tag--teal'">
                {{ user.role }}
              </span>
            </td>
            <td>
              <span class="bx--tag" :class="user.status === 'active' ? 'bx--tag--green' : 'bx--tag--gray'">
                {{ user.status }}
              </span>
            </td>
            <td>
              <button class="bx--btn bx--btn--ghost bx--btn--sm" @click="changingPwFor = user">
                Change Password
              </button>
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
.filter-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: flex-end;
}
.bx--search-input {
  height: 40px;
  flex: 1;
  max-width: 300px;
}
.bx--select-input {
  height: 40px;
  background: white;
  border: 1px solid #8d8d8d;
  padding: 0 2rem 0 1rem;
  font-size: 0.875rem;
  width: 100%;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
.form-field {
  display: flex;
  flex-direction: column;
}
.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
.bx--data-table {
  width: 100%;
  border-collapse: collapse;
}
.bx--data-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #525252;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f4f4f4;
}
.bx--data-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e0e0e0;
}
.bx--data-table tbody tr:hover {
  background: #e8e8e8;
}
</style>
