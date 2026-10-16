import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/figtree'
import '@fontsource-variable/bricolage-grotesque'
import './index.css'
import { StoreProvider } from './store.jsx'
import Layout from './components/Layout.jsx'
import Today from './pages/Today.jsx'
import Log from './pages/Log.jsx'
import Insights from './pages/Insights.jsx'
import Meds from './pages/Meds.jsx'
import Ask from './pages/Ask.jsx'
import Care from './pages/Care.jsx'
import Settings from './pages/Settings.jsx'
import Timeline from './pages/Timeline.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="log" element={<Log />} />
            <Route path="insights" element={<Insights />} />
            <Route path="meds" element={<Meds />} />
            <Route path="ask" element={<Ask />} />
            <Route path="care" element={<Care />} />
            <Route path="settings" element={<Settings />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="*" element={<Today />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
)
