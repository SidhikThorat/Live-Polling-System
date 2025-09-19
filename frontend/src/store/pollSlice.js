import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  polls: [],
  currentPoll: null,
  votes: {},
  results: {},
  loading: false,
  error: null,
}

const pollSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    setPolls: (state, action) => {
      state.polls = action.payload
    },
    addPoll: (state, action) => {
      state.polls.push(action.payload)
    },
    updatePoll: (state, action) => {
      const index = state.polls.findIndex(poll => poll.id === action.payload.id)
      if (index !== -1) {
        state.polls[index] = action.payload
      }
    },
    setCurrentPoll: (state, action) => {
      state.currentPoll = action.payload
    },
    addVote: (state, action) => {
      const { pollId, optionId, userId } = action.payload
      if (!state.votes[pollId]) {
        state.votes[pollId] = {}
      }
      state.votes[pollId][userId] = optionId
    },
    updateResults: (state, action) => {
      const { pollId, results } = action.payload
      state.results[pollId] = results
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setPolls,
  addPoll,
  updatePoll,
  setCurrentPoll,
  addVote,
  updateResults,
  setLoading,
  setError,
  clearError,
} = pollSlice.actions

export default pollSlice.reducer
