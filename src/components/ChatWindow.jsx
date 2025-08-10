import React, { useState } from "react";
import axios from "axios";
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const ChatWindow = ({ selectedUser, groupedMessages, onSendMessage, isMobile, onBack }) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 text-gray-500">Select a user to view messages</div>
      </div>
    );
  }

  const chats = groupedMessages[selectedUser]?.chats || [];

  const groupMessagesByDate = () => {
    const grouped = {};
    chats.forEach((msg) => {
      const date = parseISO(msg.timestamp);
      let dateKey;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

  const messagesByDate = groupMessagesByDate();

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const res = await axios.post("http://localhost:8000/api/send_message/", {
        wa_id: selectedUser,
        name: groupedMessages[selectedUser].user.name,
        message: newMessage,
      });
      
      if (res.data?.message) {
        onSendMessage(selectedUser, res.data.message);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
    
      <div className="bg-gray-100 p-3 border-b sticky top-0 z-10 flex items-center">
        {isMobile && (
          <button 
            onClick={onBack}
            className="mr-2 p-1 rounded-full hover:bg-gray-200"
          >
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h2 className="text-lg md:text-xl font-semibold truncate">
          {groupedMessages[selectedUser].user.name}
        </h2>
      </div>

      
      <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-50">
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date} className="mb-4">
            {/* Date divider */}
            <div className="flex items-center justify-center my-3">
              <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600">
                {date}
              </div>
            </div>
            
            
            {dateMessages.map((msg) => {
              const isOutgoing = msg.user_info?.number === "919937320320";
              const isRead = msg.status === "read";
              
              return (
                <div
                  key={msg.message_id}
                  className={`flex mb-3 ${
                    isOutgoing ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOutgoing
                        ? "bg-green-100 rounded-tr-none"
                        : "bg-white rounded-tl-none border"
                    }`}
                  >
                    {!isOutgoing && (
                      <p className="font-semibold text-gray-800">{msg.user_info?.name}</p>
                    )}
                    <p className="text-gray-800">{msg.message}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      isOutgoing ? "text-gray-500" : "text-gray-400"
                    }`}>
                      <span className="text-xs">
                        {format(parseISO(msg.timestamp), 'h:mm a')}
                      </span>
                      {isOutgoing && (
                        <span className="text-xs">
                          {isRead ? (
                            <span className="text-blue-500">✓✓</span>
                          ) : (
                            <span>✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-3 border-t sticky bottom-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border rounded-full py-2 md:py-2 px-4 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className={`w-10 h-10 md:w-10 md:h-10 rounded-full text-white flex items-center justify-center ${
              sending ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {sending ? (
              <span className="animate-pulse">...</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;