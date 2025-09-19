import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  userId: null,
  role: null, // 'teacher' or 'student'
  name: '',
  isAuthenticated: false,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { userId, name, role } = action.payload
      state.userId = userId
      state.name = name
      state.role = role
      state.isAuthenticated = true
    },
    setRole: (state, action) => {
      state.role = action.payload
      state.isAuthenticated = true
    },
    setName: (state, action) => {
      state.name = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    logout: (state) => {
      state.userId = null
      state.role = null
      state.name = ''
      state.isAuthenticated = false
      state.loading = false
      state.error = null
    },
  },
})

export const { setUser, setRole, setName, setLoading, setError, logout } = userSlice.actions
export default userSlice.reducer
