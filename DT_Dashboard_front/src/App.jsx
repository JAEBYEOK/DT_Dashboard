import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";
// ▼▼▼ [추가] FilterProvider 임포트 ▼▼▼
import { FilterProvider } from "@/context/FilterContext";
import { LanguageProvider } from "@/context/LanguageContext";

import Dashboard from './pages/Dashboard';
import Layout from './Layout';
import RoutePlanning from './pages/RoutePlanning';
import Comparison from './pages/Comparison';
import SimulationRun from './pages/SimulationRun';
import IntersectionEvaluation from './pages/IntersectionEvaluation';
import SimulationHistory from './pages/SimulationHistory';
import CombinedHUD from './pages/hud/CombinedHUD';
import LeftMap from './pages/hud/LeftMap';
import RightCharts from './pages/hud/RightCharts';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {/* ▼▼▼ [수정] FilterProvider 적용 ▼▼▼ */}
        <LanguageProvider>
        <FilterProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/simulationrun" element={<Layout><SimulationRun /></Layout>} />
              <Route path="/routeplanning" element={<Layout><RoutePlanning /></Layout>} />
              <Route path="/comparison" element={<Layout><Comparison /></Layout>} />
              <Route path="/intersectionevaluation" element={<Layout><IntersectionEvaluation /></Layout>} />
              <Route path="/simulationhistory" element={<Layout><SimulationHistory /></Layout>} />

              <Route path="/hud" element={<CombinedHUD />} />
              <Route path="/hud/left" element={<LeftMap />} />
              <Route path="/hud/right" element={<RightCharts />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;