import React, { useState } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  Brain, 
  FolderOpen, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Edit
} from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const Sidebar = () => {
  const {
    chats,
    projects,
    currentChatId,
    currentProjectId,
    currentView,
    sidebarOpen,
    createChat,
    createProject,
    setCurrentChat,
    setCurrentProject,
    setCurrentView,
    toggleSidebar,
    clearChat
  } = useMaxEvoStore()
  
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
  const handleNewChat = () => {
    const chatId = createChat()
    setCurrentChat(chatId)
  }
  
  const handleNewProject = () => {
    if (newProjectName.trim()) {
      const projectId = createProject(newProjectName.trim())
      setCurrentProject(projectId)
      setNewProjectName('')
      setShowProjectForm(false)
    }
  }
  
  const handleChatSelect = (chatId) => {
    setCurrentChat(chatId)
    setCurrentView('chat')
  }
  
  const handleProjectSelect = (projectId) => {
    setCurrentProject(projectId)
    setCurrentView('projects')
  }
  
  if (!sidebarOpen) {
    return (
      <div className="w-12 bg-sidebar-bg border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }
  
  return (
    <div className="w-80 bg-sidebar-bg border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">MaxEvo</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        {/* View Tabs */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentView === 'chat'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chats
          </button>
          <button
            onClick={() => setCurrentView('projects')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentView === 'projects'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'chat' && (
          <div className="p-4">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors mb-4"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>
            
            {/* Chat List */}
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative ${
                    currentChatId === chat.id
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{chat.title}</div>
                    <div className="text-xs text-gray-500">
                      {chat.messageCount} messages
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearChat(chat.id)
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentView === 'projects' && (
          <div className="p-4">
            {/* New Project Button */}
            <button
              onClick={() => setShowProjectForm(true)}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors mb-4"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
            
            {/* New Project Form */}
            {showProjectForm && (
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewProject()
                    if (e.key === 'Escape') setShowProjectForm(false)
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleNewProject}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowProjectForm(false)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Project List */}
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentProjectId === project.id
                      ? 'bg-gray-700 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {project.fileCount} files • {project.chatCount} chats
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentView === 'dashboard'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Dashboard</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-xs">Upload</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar