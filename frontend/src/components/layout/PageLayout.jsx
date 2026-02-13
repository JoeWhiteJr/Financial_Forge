import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function PageLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
