import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  socket: null,
  connected: false,
  connecting: false,
  error: null,
}

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connect: (state, action) => {
      state.socket = action.payload
      state.connecting = true
      state.connected = false
      state.error = null
    },
    connected: (state) => {
      state.connected = true
      state.connecting = false
      state.error = null
    },
    disconnected: (state) => {
      state.connected = false
      state.connecting = false
    },
    setError: (state, action) => {
      state.error = action.payload
      state.connecting = false
    },
    disconnect: (state) => {
      if (state.socket) {
        state.socket.disconnect()
      }
      state.socket = null
      state.connected = false
      state.connecting = false
      state.error = null
    },
  },
})

export const { connect, connected, disconnected, setError, disconnect } = socketSlice.actions
export default socketSlice.reducer
