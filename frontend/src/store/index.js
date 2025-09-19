import { configureStore } from '@reduxjs/toolkit'
import userSlice from './userSlice'
import pollSlice from './pollSlice'
import socketSlice from './socketSlice'

export const store = configureStore({
  reducer: {
    user: userSlice,
    polls: pollSlice,
    socket: socketSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connect', 'socket/disconnect'],
        ignoredPaths: ['socket.socket'],
      },
    }),
})

export default store
