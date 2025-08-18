import React from 'react'
import ReactDOM from 'react-dom/client'
import { WorkspaceRoot } from './components/WorkspaceRoot'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkspaceRoot />
  </React.StrictMode>,
)