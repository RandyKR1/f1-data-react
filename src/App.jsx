import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Route, Routes } from 'react-router-dom'
import Home from './components/utility/Home'
import PracticeResults from './components/results/PracticeResults'
import QualifyingResults from './components/results/QualifyingResults'
import RaceResults from './components/results/RaceResults'
import DriverPracticeResults from './components/results/DriverPracticeResults'



function App() {
return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice-results/:sessionKey" element={<PracticeResults />} />
      <Route path="/practice-results/:sessionKey/:sessionName/:driver_number" element={<DriverPracticeResults />} />
      <Route path="/qualy-results/:sessionKey" element={<QualifyingResults />} />
      <Route path="/race-results/:sessionKey" element={<RaceResults />} />



  {/* <Route path="/sessions" element={<Session />} /> 
      <Route path="/meetings" element={<Meeting />} />  */}
    </Routes>
  )
}

export default App
