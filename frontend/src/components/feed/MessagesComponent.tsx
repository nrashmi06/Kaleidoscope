"use client";

import Image from "next/image";
import { useState } from "react";
import { MessageCircle, Search } from "lucide-react";

interface Conversation {
  id: number;
  name: string;
  avatar: string;
}

const conversations: Conversation[] = [
  { id: 1, name: "Don John Doe", avatar: "/person.jpg" },
  { id: 2, name: "Jane Smith", avatar: "/person2.jpg" },
  { id: 3, name: "Michael Brown", avatar: "/person3.jpg" },
  { id: 4, name: "Emily Davis", avatar: "/person4.jpg" },
  { id: 5, name: "Chris Wilson", avatar: "/person5.jpg" },
  { id: 6, name: "Olivia Johnson", avatar: "/person6.jpg" },
  { id: 7, name: "Sophia Martinez", avatar: "/person7.jpg" },
  { id: 8, name: "Liam Anderson", avatar: "/person8.jpg" },
];

export function MessagesComponent() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section
      aria-labelledby="messages-heading"
      className="w-full max-w-sm mx-auto bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm"
    >
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h1
          id="messages-heading"
          className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
        >
          Messages
        </h1>

        {/* Search */}
        <div className="relative mb-4">
          <label htmlFor="search" className="sr-only">
            Search conversations
          </label>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <input
            id="search"
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Tabs */}
        <nav
          className="flex items-center justify-between"
          aria-label="Message categories"
        >
          <div className="flex space-x-6">
            <button
              className="text-sm font-medium text-black dark:text-white border-b-2 border-black pb-1"
              aria-current="page"
            >
              Primary
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition">
              General
            </button>
          </div>
          <button
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition"
            aria-label="View message requests"
          >
            Requests (4)
          </button>
        </nav>
      </header>

      {/* Conversations */}
      <ul className="p-4 space-y-1" role="list">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <li
              key={conversation.id}
              className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer rounded-lg transition"
            >
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={conversation.avatar}
                    alt={`${conversation.name}'s profile picture`}
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority={conversation.id < 3} // Preload top few avatars for performance
                  />
                </div>
                <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {conversation.name}
                </span>
              </div>
              <button
                aria-label={`Open chat with ${conversation.name}`}
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </li>
          ))
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
            No conversations found.
          </p>
        )}
      </ul>
    </section>
  );
}
