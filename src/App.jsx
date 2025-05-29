import './App.css'
import { Route, Routes } from 'react-router-dom'
import Meeting from './components/Meeting'
import Session from './components/Session'
import Home from './components/Home'
import Results from './components/Results'

function App() {
return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/race-results/:sessionKey" element={<Results />} />
      <Route path="/sessions" element={<Session />} /> 
      <Route path="/meetings" element={<Meeting />} /> 
    </Routes>
  )
}

export default App
