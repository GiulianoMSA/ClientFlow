import { NavLink } from 'react-router';

function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-gray-900">
          ClientFlow
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <NavItem
          to="/dashboard"
          label="Dashboard"
        />

        <NavItem
          to="/clients"
          label="Clientes"
        />

        <NavItem
          to="/tasks"
          label="Tarefas"
        />

        <NavItem
          to="/activities"
          label="Atividades"
        />
      </nav>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  label: string;
}

function NavItem({
  to,
  label,
}: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'block rounded-lg px-4 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export default Sidebar;