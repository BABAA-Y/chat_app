import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function App() {
  const [currentUser, setCurrentUser] = useState('usr_111');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial setup: socket status & load registered users
  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    fetch('http://localhost:5000/api/users')
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(data);
        // Default target user to chat with (someone other than currentUser)
        const defaultChatTarget = data.find((u) => u.id !== currentUser);
        if (defaultChatTarget) setSelectedUser(defaultChatTarget);
      })
      .catch((err) => console.error('Failed to load users:', err));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // 2. Open or create conversation room when selectedUser changes
useEffect(() => {
    if (!selectedUser || !currentUser) return;

    fetch('http://localhost:5000/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userOneId: currentUser,
        userTwoId: selectedUser.id,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to find or create conversation');
        return res.json();
      })
      .then((convo) => {
        if (!convo || !convo.id) return;

        setActiveConversation(convo);
        socket.emit('join_room', convo.id);

        return fetch(`http://localhost:5000/api/chat/messages/${convo.id}`);
      })
      .then((res) => (res ? res.json() : []))
      .then((history) => {
        setMessages(Array.isArray(history) ? history : []);
        scrollToBottom();
      })
      .catch((err) => console.error('Conversation loading error:', err));
  }, [selectedUser, currentUser]);

  // 3. Listen for incoming socket messages
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (activeConversation && newMessage.conversation_id === activeConversation.id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Send Message Handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      senderId: currentUser,
      messageText: inputText.trim(),
    });

    setInputText('');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4">
      <div className="flex h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        
        {/* --- LEFT SIDEBAR: USERS LIST --- */}
        <aside className="flex w-1/3 flex-col border-r border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Profile
            </label>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 outline-none transition focus:border-indigo-500"
            >
              {allUsers.map((user) => (
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
              {allUsers
                .filter((u) => u.id !== currentUser)
                .map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
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

        {/* --- RIGHT: CHAT PANE --- */}
        <section className="flex flex-1 flex-col bg-slate-950">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={
                    selectedUser?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser?.id}`
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

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No messages yet. Send a message to start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUser;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <img
                      src={msg.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_id}`}
                      alt={msg.display_name}
                      className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800"
                    />
                    <div className={`flex max-w-[70%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">{msg.display_name}</span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? 'rounded-br-xs bg-indigo-600 text-white'
                            : 'rounded-bl-xs border border-slate-800 bg-slate-900 text-slate-200'
                        }`}
                      >
                        {msg.message_text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={selectedUser ? `Message ${selectedUser.display_name}...` : 'Select a user first'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!selectedUser}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !selectedUser}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}