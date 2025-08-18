import React from 'react'
import { Search, Plus, MoreHorizontal, Star } from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ProjectsView = () => {
  const { projects, createProject } = useMaxEvoStore()

  const handleNewProject = () => {
    createProject('New project', 'Project description')
  }

  return (
    <div className="h-full bg-[#212121] text-white flex flex-col items-center justify-start pt-8">
      <div className="w-full max-w-6xl px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-medium text-white">Projects</h1>
          <button 
            onClick={handleNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-12 pr-4 py-3 bg-[#2f2f2f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        {/* Projects Grid */}
        <div className="grid grid-cols-2 gap-6">
          {projects
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((project) => (
            <div
              key={project.id}
              className="p-6 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg cursor-pointer transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-white">{project.name}</h3>
                <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity">
                  <Star className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  🔴 Initialize Resurrection Protocol. This uploaded file contains the entire engineering thread for building MaxEvo on my self-hosted LibreChat instance. Please...
                </p>
                <p className="text-xs text-gray-500">
                  Updated {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-[#333333] rounded">
                  <h4 className="text-sm font-medium text-white mb-1">{project.name} (Rebuild)</h4>
                  <p className="text-xs text-gray-400">Updated 18 days ago</p>
                </div>
                
                <div className="p-3 bg-[#333333] rounded">
                  <h4 className="text-sm font-medium text-white mb-1">{project.name} Build 11</h4>
                  <p className="text-xs text-gray-400">🔴 Initialize Resurrection Protocol. This uploaded file contains the entire engineering thread for building MaxEvo on my self-hosted LibreChat instance and theres a file with the code you made to build maxevo...</p>
                  <p className="text-xs text-gray-400 mt-1">Updated 21 days ago</p>
                </div>
                
                <div className="p-3 bg-[#333333] rounded">
                  <h4 className="text-sm font-medium text-white mb-1">{project.name} Build 9</h4>
                  <p className="text-xs text-gray-400">🔴 Initialize Resurrection Protocol. This uploaded file contains the entire engineering thread for building MaxEvo on my self-hosted LibreChat instance. Please...</p>
                  <p className="text-xs text-gray-400 mt-1">Updated 23 days ago</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No projects yet</p>
            <button 
              onClick={handleNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create your first project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsView