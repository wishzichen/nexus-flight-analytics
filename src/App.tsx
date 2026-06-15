import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Figure1DelayPatternOverview from './pages/figure1/Figure1DelayPatternOverview';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/figure-1" element={<Figure1DelayPatternOverview />} />
    </Routes>
  );
}
