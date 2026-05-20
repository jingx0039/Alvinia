/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import PublicCard from "./components/PublicCard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Base Panel Admin Dashboard Option */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Public Card Read-Only External Link Option */}
        <Route path="/card/:id" element={<PublicCard />} />
        
        {/* Catch-all Routing Option to prevent broken routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
