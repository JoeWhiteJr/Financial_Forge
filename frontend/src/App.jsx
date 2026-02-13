import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageLayout from './components/layout/PageLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import ContentPage from './pages/ContentPage';
import BloombergGuide from './pages/BloombergGuide';
import ReadingList from './pages/ReadingList';
import Admin from './pages/Admin';
import Chat from './pages/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sector-analysis" element={<ContentPage slug="sector-analysis" />} />
          <Route path="/financial-analysis" element={<ContentPage slug="financial-analysis" />} />
          <Route path="/valuation" element={<ContentPage slug="valuation" />} />
          <Route path="/bloomberg" element={<BloombergGuide />} />
          <Route path="/reading-list" element={<ReadingList />} />
          <Route path="/chat" element={<Chat />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
