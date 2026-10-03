import {
  Outlet,
  useNavigate,
} from 'react-router';

import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

function AppLayout() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  async function handleLogout() {
    await logout();

    navigate('/login', {
      replace: true,
    });
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
          <div>
            <p className="text-sm text-gray-500">
              Bem-vindo,
            </p>

            <p className="font-medium text-gray-900">
              {user?.name}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Sair
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;