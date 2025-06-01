import './App.css'
import { Route, Routes } from 'react-router-dom'
import Meeting from './components/general/Meeting'
import Session from './components/general/Session'
import Home from './components/general/Home'
import Results from './components/Results'
import DriverResults from './components/DriverResults'

function App() {
return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/results/:sessionKey" element={<Results />} />
      <Route path="/results/:sessionKey/driver/:driverNumber" element={<DriverResults />} />
      <Route path="/sessions" element={<Session />} /> 
      <Route path="/meetings" element={<Meeting />} /> 
    </Routes>
  )
}

export default App
