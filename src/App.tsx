/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Oggi from './pages/Oggi';
import Diario from './pages/Diario';
import Progressi from './pages/Progressi';
import Profilo from './pages/Profilo';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Oggi />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/progressi" element={<Progressi />} />
          <Route path="/profilo" element={<Profilo />} />
        </Routes>
      </Layout>
    </Router>
  );
}

