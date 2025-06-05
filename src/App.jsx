import './App.css'
import { Route, Routes } from 'react-router-dom'
import Meeting from './components/general/Meeting'
import Session from './components/general/Session'
import Home from './components/utility/Home'
import PracticeResults from './components/results/PracticeResults'


function App() {
return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice-results/:sessionKey" element={<PracticeResults />} />
      <Route path="/sessions" element={<Session />} /> 
      <Route path="/meetings" element={<Meeting />} /> 
    </Routes>
  )
}

export default App
