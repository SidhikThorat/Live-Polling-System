import { createSlice } from '@reduxjs/toolkit'

// Load initial state from localStorage if available
const loadAuthFromStorage = () => {
  try {
    const authData = localStorage.getItem('intervue_auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      return {
        userId: parsed.userId,
        role: parsed.role,
        name: parsed.name,
        isAuthenticated: true,
        loading: false,
        error: null,
      }
    }
  } catch (error) {
    console.error('Error loading auth from localStorage:', error)
    localStorage.removeItem('intervue_auth')
  }
  
  return {
    userId: null,
    role: null, // 'teacher' or 'student'
    name: '',
    isAuthenticated: false,
    loading: false,
    error: null,
  }
}

const initialState = loadAuthFromStorage()

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
      
      // Save to localStorage
      try {
        localStorage.setItem('intervue_auth', JSON.stringify({
          userId,
          name,
          role,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Error saving auth to localStorage:', error)
      }
    },
    setRole: (state, action) => {
      state.role = action.payload
      state.isAuthenticated = true
      
      // Update localStorage
      try {
        const authData = JSON.parse(localStorage.getItem('intervue_auth') || '{}')
        authData.role = action.payload
        localStorage.setItem('intervue_auth', JSON.stringify(authData))
      } catch (error) {
        console.error('Error updating role in localStorage:', error)
      }
    },
    setName: (state, action) => {
      state.name = action.payload
      
      // Update localStorage
      try {
        const authData = JSON.parse(localStorage.getItem('intervue_auth') || '{}')
        authData.name = action.payload
        localStorage.setItem('intervue_auth', JSON.stringify(authData))
      } catch (error) {
        console.error('Error updating name in localStorage:', error)
      }
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
      
      // Remove from localStorage
      try {
        localStorage.removeItem('intervue_auth')
      } catch (error) {
        console.error('Error removing auth from localStorage:', error)
      }
    },
  },
})

export const { setUser, setRole, setName, setLoading, setError, logout } = userSlice.actions
export default userSlice.reducer
