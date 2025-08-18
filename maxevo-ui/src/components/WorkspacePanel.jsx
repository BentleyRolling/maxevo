import React, { useState, useEffect } from 'react'

const WorkspaceWidgets = {
  RichText: ({ data }) => (
    <div className="workspace-widget rich-text">
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </div>
  ),
  
  Table: ({ data }) => (
    <div className="workspace-widget table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              {data.columns.map(col => (
                <th key={col} className="text-left py-2 px-3 font-medium text-gray-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                {data.columns.map(col => (
                  <td key={col} className="py-2 px-3 text-gray-400">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
  
  CardList: ({ data }) => (
    <div className="workspace-widget card-list">
      <div className="space-y-3">
        {data.items.map((item, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-medium text-white mb-1">{item.title}</h3>
            {item.subtitle && (
              <p className="text-gray-400 text-sm mb-2">{item.subtitle}</p>
            )}
            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
              >
                View Source
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
  
  Timeline: ({ data }) => (
    <div className="workspace-widget timeline">
      <div className="space-y-4">
        {data.events.map(event => (
          <div key={event.id} className="relative pl-6 border-l border-gray-700">
            <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900"></div>
            <h4 className="font-medium text-white">{event.title}</h4>
            <div className="text-sm text-gray-400 mt-1">
              {event.start} - {event.end}
            </div>
            {event.notes && (
              <p className="text-gray-300 text-sm mt-2">{event.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
  
  Form: ({ data }) => (
    <div className="workspace-widget form">
      <form className="space-y-4">
        {data.fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              defaultValue={field.value || ''}
              name={field.key}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

const WorkspacePanel = ({ workspace, isOpen, onToggle }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  
  useEffect(() => {
    if (!workspace?.jobId) return
    
    const eventSource = new EventSource(`/v1/workspace/stream/${workspace.jobId}`)
    
    eventSource.onopen = () => {
      setConnectionStatus('connected')
    }
    
    eventSource.onerror = () => {
      setConnectionStatus('error')
    }
    
    return () => {
      eventSource.close()
      setConnectionStatus('disconnected')
    }
  }, [workspace?.jobId])
  
  if (!workspace) {
    return (
      <div className={`${isOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden bg-[#1a1a1a] border-l border-gray-700`}>
        {isOpen && (
          <div className="p-6 h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <p>No active workspace</p>
              <p className="text-sm mt-1">Send a message to get started</p>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`${isOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden bg-[#1a1a1a] border-l border-gray-700 flex flex-col`}>
      {isOpen && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Workspace</h2>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-900/30 text-green-400'
                    : connectionStatus === 'error'
                    ? 'bg-red-900/30 text-red-400'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' : 
                    connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'error' ? 'Error' : 'Offline'}
                </div>
                <button
                  onClick={onToggle}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {workspace.widgets && workspace.widgets.length > 0 ? (
              workspace.widgets.map(widget => {
                const WidgetComponent = WorkspaceWidgets[widget.type]
                return WidgetComponent ? (
                  <div key={widget.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <WidgetComponent data={widget.data} />
                  </div>
                ) : (
                  <div key={widget.id} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400 text-sm">Unknown widget type: {widget.type}</p>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="w-12 h-12 mx-auto mb-3 opacity-50">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p>Workspace is ready</p>
                <p className="text-sm mt-1">Widgets will appear here as Max processes your requests</p>
              </div>
            )}
            
            {/* Suggested Actions */}
            {workspace.suggestedActions && workspace.suggestedActions.length > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Suggested Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {workspace.suggestedActions.map(action => (
                    <button
                      key={action.id}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    >
                      {action.id.charAt(0).toUpperCase() + action.id.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default WorkspacePanel