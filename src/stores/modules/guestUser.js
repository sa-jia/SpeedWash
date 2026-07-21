import { defineStore } from 'pinia'

export const useGuestUserStore = defineStore('guestUser', {
  state: () => ({
    guestUser: null,
    isAuthenticated: false
  }),
  
  actions: {
    createGuestUser() {
      const guestId = 'guest_' + Math.random().toString(36).substr(2, 9)
      const timestamp = new Date().getTime()
      
      this.guestUser = {
        id: guestId,
        createdAt: timestamp,
        type: 'guest'
      }
      
      this.isAuthenticated = true
      localStorage.setItem('guestUser', JSON.stringify(this.guestUser))
    },

    loadGuestUser() {
      const savedUser = localStorage.getItem('guestUser')
      if (savedUser) {
        this.guestUser = JSON.parse(savedUser)
        this.isAuthenticated = true
      }
    },

    logout() {
      this.guestUser = null
      this.isAuthenticated = false
      localStorage.removeItem('guestUser')
    }
  }
}) 