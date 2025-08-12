import React, { useEffect, useState } from 'react';

const WorkspaceWidgets = {
  RichText: ({ data }) => (
    <div className="widget rich-text" dangerouslySetInnerHTML={{ __html: data.html }} />
  ),
  
  Table: ({ data }) => (
    <div className="widget table">
      <table>
        <thead>
          <tr>
            {data.columns.map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {data.columns.map(col => <td key={col}>{row[col]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  
  CardList: ({ data }) => (
    <div className="widget card-list">
      {data.items.map((item, i) => (
        <div key={i} className="card">
          <h3>{item.title}</h3>
          {item.subtitle && <p className="subtitle">{item.subtitle}</p>}
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">View Source</a>}
        </div>
      ))}
    </div>
  ),
  
  Timeline: ({ data }) => (
    <div className="widget timeline">
      {data.events.map(event => (
        <div key={event.id} className="timeline-event">
          <h4>{event.title}</h4>
          <div className="time-range">
            {event.start} - {event.end}
          </div>
          {event.notes && <p>{event.notes}</p>}
        </div>
      ))}
    </div>
  ),
  
  Form: ({ data }) => (
    <div className="widget form">
      <form>
        {data.fields.map(field => (
          <div key={field.key} className="form-field">
            <label>{field.label}</label>
            <input
              type="text"
              defaultValue={field.value || ''}
              name={field.key}
            />
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  )
};

export function WorkspaceRoot({ jobId, onAction }) {
  const [widgets, setWidgets] = useState([]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/v1/workspace/stream/${jobId}`);
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setWidgets(data.widgets || []);
        setSuggestedActions(data.suggestedActions || []);
      } catch (error) {
        console.error('Failed to parse workspace event:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('error');
    };

    return () => {
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, [jobId]);

  const handleAction = (actionId) => {
    if (onAction) {
      onAction(actionId, jobId);
    }
  };

  if (!jobId) {
    return (
      <div className="workspace-empty">
        <p>No active workspace. Send a message to get started.</p>
      </div>
    );
  }

  return (
    <div className="workspace-root">
      <div className="workspace-header">
        <h2>Workspace</h2>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' && '🟢 Live'}
          {connectionStatus === 'disconnected' && '⚫ Disconnected'}
          {connectionStatus === 'error' && '🔴 Error'}
        </div>
      </div>

      <div className="widgets-container">
        {widgets.length === 0 ? (
          <div className="no-widgets">
            <p>Workspace is ready. Widgets will appear here as Max processes your requests.</p>
          </div>
        ) : (
          widgets.map(widget => {
            const WidgetComponent = WorkspaceWidgets[widget.type];
            return WidgetComponent ? (
              <div key={widget.id} className="widget-wrapper">
                <WidgetComponent data={widget.data} />
              </div>
            ) : (
              <div key={widget.id} className="widget-error">
                Unknown widget type: {widget.type}
              </div>
            );
          })
        )}
      </div>

      {suggestedActions.length > 0 && (
        <div className="suggested-actions">
          <h3>Suggested Actions</h3>
          <div className="actions-list">
            {suggestedActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="action-button"
              >
                {action.id.charAt(0).toUpperCase() + action.id.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}