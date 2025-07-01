"use client";
import { MessageCircle, Search } from "lucide-react";

const conversations = [
  { id: 1, name: "Don Jhon Doe", avatar: "/person.jpg?height=40&width=40" },
  { id: 2, name: "Don Jhon Doe", avatar: "/person2.jpg?height=40&width=40" },
  { id: 3, name: "Don Jhon Doe", avatar: "/person3.jpg?height=40&width=40" },
  { id: 4, name: "Don Jhon Doe", avatar: "/person4.jpg?height=40&width=40" },
  { id: 5, name: "Don Jhon Doe", avatar: "/person5.jpg?height=40&width=40" },
  { id: 6, name: "Don Jhon Doe", avatar: "/person6.jpg?height=40&width=40" },
  { id: 7, name: "Don Jhon Doe", avatar: "/person7.jpg?height=40&width=40" },
  { id: 8, name: "Don Jhon Doe", avatar: "/person8.jpg?height=40&width=40" },
];

export function MessagesComponent() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            <button className="text-sm font-medium text-black dark:text-white border-b-2 border-black pb-1">
              Primary
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white">
              General
            </button>
          </div>
          <button className="text-sm font-medium text-blue-500 hover:text-blue-600">
            Requests(4)
          </button>
        </div>
      </div>

      {/* Conversations */}
      <div className="p-4 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <img
                src={conversation.avatar}
                alt={conversation.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {conversation.name}
              </span>
            </div>
            <button className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
