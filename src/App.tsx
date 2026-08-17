import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { AppLayout } from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import Scan from "@/pages/Scan";
import PatientProfile from "@/pages/PatientProfile";
import TriageGroup from "@/pages/TriageGroup";
import Splash from "@/pages/Splash";
import NotFound from "@/pages/NotFound";
import { DirectorPanel } from "@/components/director/DirectorPanel";
import { SpeakerNotes } from "@/components/director/SpeakerNotes";

const CasesMap = lazy(() => import("@/pages/CasesMap"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));

export default function App() {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Splash />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/patient/:id" element={<PatientProfile />} />
            <Route path="/triage" element={<TriageGroup />} />
            <Route
              path="/map"
              element={
                <Suspense fallback={null}>
                  <CasesMap />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={null}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AnimatePresence>
      <SpeakerNotes />
      <DirectorPanel />
    </>
  );
}
