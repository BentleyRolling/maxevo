import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMaxEvoStore = create(
  persist(
    (set, get) => ({
      // Chat Management
      chats: [],
      currentChatId: null,
      messages: {},
      
      // Project Management (Claude-style)
      projects: [],
      currentProjectId: null,
      projectFiles: {},
      
      // Agent Status
      activeAgent: null,
      agentStatus: 'idle', // idle, thinking, executing, error
      taskQueue: [],
      
      // System Status
      systemStatus: {
        memoryCore: 'offline',
        scheduler: 'offline',
        agentRouter: 'offline',
        webSocket: 'offline'
      },
      
      // Job and Session Management
      sessionId: null,
      queuedJobs: [],
      jobPollingTimeouts: {},
      
      // UI State
      sidebarOpen: true,
      currentView: 'chat', // chat, projects, dashboard
      
      // Actions
      createChat: (title = 'New Chat') => {
        const chatId = Date.now().toString()
        const newChat = {
          id: chatId,
          title,
          createdAt: new Date().toISOString(),
          projectId: get().currentProjectId,
          messageCount: 0
        }
        
        set(state => ({
          chats: [newChat, ...state.chats],
          currentChatId: chatId,
          messages: {
            ...state.messages,
            [chatId]: []
          }
        }))
        
        return chatId
      },
      
      addMessage: (chatId, message) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), {
              ...message,
              id: Date.now().toString(),
              timestamp: new Date().toISOString()
            }]
          },
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { ...chat, messageCount: chat.messageCount + 1, updatedAt: new Date().toISOString() }
              : chat
          )
        }))
      },
      
      setCurrentChat: (chatId) => {
        set({ currentChatId: chatId })
      },
      
      createProject: (name, description = '') => {
        const projectId = Date.now().toString()
        const newProject = {
          id: projectId,
          name,
          description,
          createdAt: new Date().toISOString(),
          chatCount: 0,
          fileCount: 0
        }
        
        set(state => ({
          projects: [newProject, ...state.projects],
          currentProjectId: projectId,
          projectFiles: {
            ...state.projectFiles,
            [projectId]: []
          }
        }))
        
        return projectId
      },
      
      setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId })
      },
      
      uploadFile: (projectId, file) => {
        set(state => ({
          projectFiles: {
            ...state.projectFiles,
            [projectId]: [...(state.projectFiles[projectId] || []), {
              id: Date.now().toString(),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            }]
          },
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, fileCount: project.fileCount + 1 }
              : project
          )
        }))
      },
      
      setAgentStatus: (status, agent = null) => {
        set({ agentStatus: status, activeAgent: agent })
      },
      
      addToTaskQueue: (task) => {
        set(state => ({
          taskQueue: [...state.taskQueue, {
            ...task,
            id: Date.now().toString(),
            status: 'pending',
            createdAt: new Date().toISOString()
          }]
        }))
      },
      
      updateTaskStatus: (taskId, status) => {
        set(state => ({
          taskQueue: state.taskQueue.map(task =>
            task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
          )
        }))
      },
      
      updateSystemStatus: (component, status) => {
        set(state => ({
          systemStatus: {
            ...state.systemStatus,
            [component]: status
          }
        }))
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }))
      },
      
      setCurrentView: (view) => {
        set({ currentView: view })
      },
      
      clearChat: (chatId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: []
          },
          chats: state.chats.map(chat =>
            chat.id === chatId ? { ...chat, messageCount: 0 } : chat
          )
        }))
      },
      
      // Job Management
      setSessionId: (sessionId) => {
        set({ sessionId })
      },
      
      getOrCreateSessionId: () => {
        const state = get()
        if (state.sessionId) return state.sessionId
        
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set({ sessionId: newSessionId })
        return newSessionId
      },
      
      addQueuedJob: (jobId) => {
        set(state => ({
          queuedJobs: [...state.queuedJobs.filter(id => id !== jobId), jobId]
        }))
      },
      
      removeQueuedJob: (jobId) => {
        set(state => {
          const newQueuedJobs = state.queuedJobs.filter(id => id !== jobId)
          
          // Clear any polling timeout for this job
          const newTimeouts = { ...state.jobPollingTimeouts }
          if (newTimeouts[jobId]) {
            clearTimeout(newTimeouts[jobId])
            delete newTimeouts[jobId]
          }
          
          return { 
            queuedJobs: newQueuedJobs,
            jobPollingTimeouts: newTimeouts
          }
        })
      },
      
      hasQueuedJobs: () => {
        return get().queuedJobs.length > 0
      },
      
      addJobPollingTimeout: (jobId, timeoutId) => {
        set(state => ({
          jobPollingTimeouts: {
            ...state.jobPollingTimeouts,
            [jobId]: timeoutId
          }
        }))
      }
    }),
    {
      name: 'maxevo-storage',
      partialize: (state) => ({
        chats: state.chats,
        projects: state.projects,
        messages: state.messages,
        projectFiles: state.projectFiles,
        currentProjectId: state.currentProjectId
      })
    }
  )
)