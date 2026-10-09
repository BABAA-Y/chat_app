export default function MessageBubble({ message, isMe }) {
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      <img
        src={message.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${message.sender_id}`}
        alt={message.display_name}
        className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
      />
      <div className={`flex max-w-[70%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
          <span className="font-medium text-slate-300">{message.display_name}</span>
          <span>{formattedTime}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isMe
              ? 'rounded-br-xs bg-indigo-600 text-white'
              : 'rounded-bl-xs border border-slate-800 bg-slate-900 text-slate-200'
          }`}
        >
          {message.message_text}
        </div>
      </div>
    </div>
  );
}