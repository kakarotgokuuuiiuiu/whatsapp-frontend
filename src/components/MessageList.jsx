import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

const MessageList = () => {
  const [groupedMessages, setGroupedMessages] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/messages/');
      const grouped = {};
      
      res.data.forEach(msg => {
        if (!grouped[msg.wa_id]) {
          grouped[msg.wa_id] = { 
            user: msg.user_info, 
            chats: [],
            unreadCount: 0
          };
        }
        grouped[msg.wa_id].chats.push(msg);
        
        if (msg.status !== 'read' && msg.user_info?.number !== "919937320320") {
          grouped[msg.wa_id].unreadCount += 1;
        }
      });
      
      setGroupedMessages(grouped);
      setSelectedUser(prev => prev || Object.keys(grouped)[0] || null);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    
    const pollInterval = setInterval(fetchMessages, 10000); 
    
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  const handleSendMessage = useCallback((wa_id, newMsg) => {
    setGroupedMessages(prev => {
      const userChats = prev[wa_id]?.chats || [];
      
      const exists = userChats.some(
        msg => msg.message_id === newMsg.message_id || 
              (msg.timestamp === newMsg.timestamp && msg.message === newMsg.message)
      );
      
      if (exists) return prev;

      return {
        ...prev,
        [wa_id]: {
          ...prev[wa_id],
          chats: [...userChats, newMsg],
        },
      };
    });
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    
    setGroupedMessages(prev => {
      const userData = prev[selectedUser];
      if (!userData || userData.unreadCount === 0) return prev;

      return {
        ...prev,
        [selectedUser]: {
          ...userData,
          unreadCount: 0,
          chats: userData.chats.map(msg => ({
            ...msg,
            status: msg.status === 'delivered' ? 'read' : msg.status
          }))
        }
      };
    });
  }, [selectedUser]);

  if (loading && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
        <button 
          onClick={fetchMessages}
          className="ml-2 px-3 py-1 bg-green-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans bg-gray-100">
      <Sidebar
        groupedMessages={groupedMessages}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />
      
      {selectedUser ? (
        <ChatWindow
          selectedUser={selectedUser}
          groupedMessages={groupedMessages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">No chats available</p>
        </div>
      )}
    </div>
  );
};

export default MessageList;