import React from 'react';
import { format, parseISO } from 'date-fns';

const Sidebar = ({ groupedMessages = {}, selectedUser, setSelectedUser, isMobile }) => {
  const sortedConversations = Object.entries(groupedMessages)
    .map(([wa_id, data]) => ({
      wa_id,
      ...data,
      lastMessage: data.chats?.[data.chats.length - 1]
    }))
    .sort((a, b) => (
      new Date(b.lastMessage?.timestamp || 0) - 
      new Date(a.lastMessage?.timestamp || 0)
    ));

  return (
    <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r bg-white h-screen flex flex-col`}>
    
      <div className="p-3 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg text-sm focus:outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.map(({ wa_id, user, lastMessage, unreadCount }) => {
          const isSelected = selectedUser === wa_id;
          const time = lastMessage?.timestamp 
            ? format(parseISO(lastMessage.timestamp), 'h:mm a') 
            : '';

          return (
            <div
              key={wa_id}
              onClick={() => setSelectedUser(wa_id)}
              className={`flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-gray-100' : ''
              }`}
            >
              
              <div className="rounded-full bg-gray-300 w-12 h-12 flex items-center justify-center text-gray-600 font-bold mr-3">
                {user?.name?.charAt(0) || '?'}
              </div>

          
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900 truncate">
                    {user?.name || 'Unknown'}
                  </p>
                  {time && (
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {time}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage?.message || 'No messages yet'}
                  </p>
                  {unreadCount > 0 && (
                    <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs ml-2">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;