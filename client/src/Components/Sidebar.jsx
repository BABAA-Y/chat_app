export default function Sidebar({ users, currentUser, onSelectUser, selectedUser, onSwitchProfile }) {
  return (
    <aside className="flex w-1/3 flex-col border-r border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 p-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Active Profile
        </label>
        <select
          value={currentUser}
          onChange={(e) => onSwitchProfile(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 outline-none transition focus:border-indigo-500"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.display_name} ({user.id})
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Direct Messages
        </h2>
        <div className="space-y-1">
          {users
            .filter((u) => u.id !== currentUser)
            .map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                    alt={u.display_name}
                    className="h-9 w-9 rounded-full border border-slate-700 bg-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.display_name}</p>
                    <p className={`truncate text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {u.email}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </aside>
  );
}