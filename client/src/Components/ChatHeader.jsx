export default function ChatHeader({ selectedUser, activeConversation, isConnected }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={
              selectedUser?.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser?.id || 'default'}`
            }
            alt={selectedUser?.display_name || 'User'}
            className="h-10 w-10 rounded-full border border-slate-700 bg-slate-800"
          />
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">
            {selectedUser ? selectedUser.display_name : 'Select a conversation'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeConversation ? `Room: ${activeConversation.id}` : 'No active room'}
          </p>
        </div>
      </div>
    </header>
  );
}