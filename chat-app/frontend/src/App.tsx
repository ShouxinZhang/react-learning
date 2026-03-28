import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useChatStore } from './stores/chatStore';
import { LoginPanel } from './components/LoginPanel/LoginPanel';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatWindow } from './components/ChatWindow/ChatWindow';
import './App.css';

function Home() {
  const currentChatId = useChatStore((s) => s.currentChatId);
  const setCurrentChatId = useChatStore((s) => s.setCurrentChat);
  // Establish WebSocket connection
  useChat();

  return (
    <div className={`app-layout${currentChatId !== null ? ' chat-open' : ''}`}>
      <div className="app-sidebar">
        <Sidebar />
      </div>
      <div className="app-main">
        <ChatWindow chatId={currentChatId} onBack={() => setCurrentChatId(null)} />
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPanel />}
      />
    </Routes>
  );
}

export default App;
