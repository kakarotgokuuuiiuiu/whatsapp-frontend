import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [state, setState] = useState({
    groupedMessages: {},
    selectedUser: null,
    loading: true,
    error: "",
    isOnline: navigator.onLine,
    isMobile: window.innerWidth < 768
  });

  useEffect(() => {
    const handleResize = () => {
      setState(prev => ({ ...prev, isMobile: window.innerWidth < 768 }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleStatusChange = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!state.isOnline) {
      setState(prev => ({ ...prev, 
        error: "You're offline. Connect to load messages.",
        loading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      const res = await axios.get("https://whatsapp-backend-q2jg.onrender.com/api/messages/");
      
      const grouped = res.data.reduce((acc, msg) => {
        const waId = msg.wa_id;
        acc[waId] = acc[waId] || {
          user: msg.user_info,
          chats: [],
          unreadCount: 0
        };
        
        acc[waId].chats.push(msg);
        if (msg.status !== 'read' && msg.user_info?.number !== "919937320320") {
          acc[waId].unreadCount += 1;
        }
        return acc;
      }, {});

      setState(prev => ({
        ...prev,
        groupedMessages: grouped,
        selectedUser: prev.selectedUser || Object.keys(grouped)[0] || null,
        error: "",
        loading: false
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: "Failed to load messages. Please try again.",
        loading: false
      }));
    }
  }, [state.isOnline]);

  useEffect(() => {
    fetchMessages();
    const pollInterval = setInterval(fetchMessages, 15000);
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  const handleSendMessage = useCallback((wa_id, newMsg) => {
    setState(prev => {
      const existing = prev.groupedMessages[wa_id] || { 
        user: newMsg.user_info, 
        chats: [],
        unreadCount: 0
      };
      
      const updatedChats = [...existing.chats, newMsg]
        .filter((msg, idx, self) => 
          idx === self.findIndex(m => m.message_id === msg.message_id)
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return {
        ...prev,
        groupedMessages: {
          ...prev.groupedMessages,
          [wa_id]: {
            ...existing,
            chats: updatedChats
          }
        }
      };
    });
  }, []);

  const handleSelectUser = useCallback((wa_id) => {
    setState(prev => {
      const userData = prev.groupedMessages[wa_id];
      if (!userData || userData.unreadCount === 0) {
        return { ...prev, selectedUser: wa_id };
      }

      return {
        ...prev,
        selectedUser: wa_id,
        groupedMessages: {
          ...prev.groupedMessages,
          [wa_id]: {
            ...userData,
            unreadCount: 0,
            chats: userData.chats.map(msg => ({
              ...msg,
              status: msg.status === 'delivered' ? 'read' : msg.status
            }))
          }
        }
      };
    });
  }, []);

  const { groupedMessages, selectedUser, loading, error, isOnline, isMobile } = state;

  return (
    <div className="flex h-screen bg-white">
      {(!isMobile || !selectedUser) && (
        <Sidebar
          groupedMessages={groupedMessages}
          selectedUser={selectedUser}
          setSelectedUser={handleSelectUser}
          isMobile={isMobile}
        />
      )}

      <main className="flex-1 flex flex-col">
        {!isOnline && (
          <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-sm">
            You're offline - messages may not sync
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-red-600 mb-4 max-w-md text-center">{error}</p>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : selectedUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            groupedMessages={groupedMessages}
            onSendMessage={handleSendMessage}
            isMobile={isMobile}
            onBack={() => setState(prev => ({ ...prev, selectedUser: null }))}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a chat to begin</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;