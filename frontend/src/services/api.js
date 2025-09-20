import axios from 'axios'

const API_BASE_URL = 'https://live-polling-system-okl9.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API
export const authAPI = {
  login: (name, role) => api.post('/auth/login', { name, role }),
  updateSocket: (userId, socketId) => api.put(`/auth/socket/${userId}`, { socketId }),
  getUser: (userId) => api.get(`/auth/user/${userId}`),
}

// Polls API
export const pollsAPI = {
  getAll: () => api.get('/polls'),
  getActive: () => api.get('/polls/active'),
  getById: (id) => api.get(`/polls/${id}`),
  create: (pollData) => api.post('/polls', pollData),
  updateStatus: (id, status) => api.put(`/polls/${id}/status`, { status }),
  getResults: (id) => api.get(`/polls/${id}/results`),
}

// Votes API
export const votesAPI = {
  submit: (voteData) => api.post('/votes', voteData),
  getUserVote: (userId, pollId) => api.get(`/votes/user/${userId}/poll/${pollId}`),
  getPollVotes: (pollId) => api.get(`/votes/poll/${pollId}`),
}

// Students API (good-to-have)
export const studentsAPI = {
  list: () => api.get('/students'),
  remove: (id) => api.put(`/students/${id}/remove`),
  getParticipants: () => api.get('/students/participants'),
}

// Chat API
export const chatAPI = {
  getMessages: () => api.get('/chat'),
  getRecentMessages: () => api.get('/chat/recent'),
}

export default api
