import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import Sidebar from './Components/Sidebar';
import ChatHeader from './Components/ChatHeader';
import MessageBubble from './Components/MessageBubble';
import MessageInput from './Components/MessageInput';

const socket = io('http://localhost:5000');

export default function App() {
  const [currentUser, setCurrentUser] = useState('usr_111');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [typingUser, setTypingUser] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial setup
  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    fetch('http://localhost:5000/api/users')
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(data);
        const defaultChatTarget = data.find((u) => u.id !== currentUser);
        if (defaultChatTarget) setSelectedUser(defaultChatTarget);
      })
      .catch((err) => console.error('Failed to load users:', err));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // 2. Room initialization
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    // Instantly wipe previous messages from screen & clear typing state
    setMessages([]);
    setTypingUser(null);

    fetch('http://localhost:5000/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userOneId: currentUser,
        userTwoId: selectedUser.id,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to access conversation');
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

  // 3. Socket event listeners
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      if (activeConversation && newMessage.conversation_id === activeConversation.id) {
        setMessages((prev) => [...prev, newMessage]);
        setTypingUser(null);
      }
    };

    const handleUserTyping = ({ displayName }) => {
      setTypingUser(displayName);
    };

    const handleUserStopTyping = () => {
      setTypingUser(null);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  // Handler functions passed down to MessageInput
  const handleSendMessage = (text) => {
    if (!activeConversation) return;

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      senderId: currentUser,
      messageText: text,
    });
  };

  const handleTyping = () => {
    if (!activeConversation) return;
    const currentProfile = allUsers.find((u) => u.id === currentUser);
    socket.emit('typing', {
      conversationId: activeConversation.id,
      displayName: currentProfile ? currentProfile.display_name : 'Someone',
    });
  };

  const handleStopTyping = () => {
    if (!activeConversation) return;
    socket.emit('stop_typing', { conversationId: activeConversation.id });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4">
      <div className="flex h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <Sidebar
          users={allUsers}
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
          onSwitchProfile={setCurrentUser}
        />

        <section className="flex flex-1 flex-col bg-slate-950">
          <ChatHeader
            selectedUser={selectedUser}
            activeConversation={activeConversation}
            isConnected={isConnected}
          />

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No messages yet. Send a message to start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMe={msg.sender_id === currentUser}
                />
              ))
            )}

            {typingUser && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400 italic">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                </span>
                <span>{typingUser} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            disabled={!selectedUser}
            placeholder={selectedUser ? `Message ${selectedUser.display_name}...` : 'Select a user first'}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
          />
        </section>
      </div>
    </div>
  );
}