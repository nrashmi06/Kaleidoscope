"use client"

import { ChevronLeft, ChevronRight, Users, Play, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

interface LiveSession {
  id: string
  title: string
  creator: string
  viewers: number
  thumbnail: string
  category: string
  isLive: boolean
  startTime?: string
  likes?: number
  description?: string
}

const mockLiveSessions: LiveSession[] = [
  {
    id: "1",
    title: "Electro SOUND Festival",
    creator: "DJ MixMaster",
    viewers: 1250,
    thumbnail: "/nature1.jpg?height=400&width=600",
    category: "Music",
    isLive: true,
    startTime: "SATURDAY, 9:00 PM",
    likes: 89,
    description: "Epic electronic music festival with top DJs from around the world",
  },
  {
    id: "2",
    title: "HAPPY HOLI Celebration",
    creator: "Jhon Doe",
    viewers: 230,
    thumbnail: "/nature2.jpg?height=400&width=600",
    category: "Festival",
    isLive: true,
    likes: 156,
    description: "Colorful Holi festival celebration with traditional music and dance",
  },
  {
    id: "3",
    title: "Dream Wedding Setup",
    creator: "EventPro",
    viewers: 89,
    thumbnail: "/nature1.jpg?height=400&width=600",
    category: "Events",
    isLive: true,
    likes: 45,
    description: "Behind the scenes of a luxury wedding setup",
  },
  {
    id: "4",
    title: "Gaming Tournament Finals",
    creator: "ProGamer",
    viewers: 3420,
    thumbnail: "/nature2.jpg?height=400&width=600",
    category: "Gaming",
    isLive: true,
    likes: 892,
    description: "Epic gaming tournament finals - who will take the crown?",
  },
  {
    id: "5",
    title: "Cooking Masterclass",
    creator: "Chef Maria",
    viewers: 567,
    thumbnail: "/nature3.jpg?height=400&width=600",
    category: "Cooking",
    isLive: true,
    likes: 234,
    description: "Learn to cook authentic Italian pasta from a master chef",
  },
]

export default function LiveStream() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalLiveSessions, setTotalLiveSessions] = useState(0)

  useEffect(() => {
    setTotalLiveSessions(mockLiveSessions.filter((s) => s.isLive).length)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % mockLiveSessions.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mockLiveSessions.length) % mockLiveSessions.length)
  }

  const getCardAtIndex = (offset: number) => {
    const index = (currentIndex + offset + mockLiveSessions.length) % mockLiveSessions.length
    return mockLiveSessions[index]
  }

  const centerCard = getCardAtIndex(0)
  const leftCard = getCardAtIndex(-1)
  const rightCard = getCardAtIndex(1)

  return (
    <div className="w-full max-w-7xl mx-auto pt-1 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-steel dark:text-sky/60 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-md shadow-red-500/40" />
              <span className="text-red-500 font-semibold">{totalLiveSessions}</span>
            </span>
            live sessions currently hosting
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full border-2 border-cream-300/60 dark:border-navy-700/60 bg-cream-50 dark:bg-navy-700/50 hover:bg-cream-300/30 dark:hover:bg-navy-600/40 hover:scale-110 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-steel dark:text-sky" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full border-2 border-cream-300/60 dark:border-navy-700/60 bg-cream-50 dark:bg-navy-700/50 hover:bg-cream-300/30 dark:hover:bg-navy-600/40 hover:scale-110 transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-steel dark:text-sky" />
          </button>
        </div>
      </div>

      {/* Card Layout */}
      <div className="relative h-96 flex items-center justify-center">
        {/* Left */}
        <div
          className="absolute left-16 scale-75 opacity-60 hover:opacity-80 transition cursor-pointer z-10"
          onClick={prevSlide}
        >
          <div className="relative w-64 h-40 rounded-2xl overflow-hidden shadow-md border border-cream-300/30 dark:border-navy-700/30">
            <Image
              src={leftCard.thumbnail}
              alt={leftCard.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-navy/40" />
            <div className="absolute top-2 left-2 bg-red-500 text-cream-50 px-2 py-1 rounded-lg text-xs font-semibold">Live</div>
            <div className="absolute bottom-2 left-2 text-cream-50">
              <p className="text-sm font-semibold truncate">{leftCard.title}</p>
              <p className="text-xs opacity-80">{leftCard.viewers.toLocaleString()} watching</p>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="z-20 transform scale-100">
          <div className="relative w-96 h-80 rounded-2xl overflow-hidden shadow-2xl shadow-steel/10 dark:shadow-sky/10 border border-cream-300/20 dark:border-navy-700/20">
            <Image
              src={centerCard.thumbnail}
              alt={centerCard.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-navy/40" />
            <div className="absolute top-4 left-4 bg-red-600 text-cream-50 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 bg-cream-50 rounded-full animate-pulse" />
              LIVE
            </div>
            <div className="absolute top-4 right-4 bg-navy/60 backdrop-blur-sm text-cream-50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{centerCard.viewers.toLocaleString()}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="bg-cream-50/90 dark:bg-navy/80 p-4 rounded-full shadow-lg backdrop-blur-sm">
                <Play className="w-6 h-6 text-steel dark:text-sky" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-navy/80 to-transparent text-cream-50">
              {centerCard.startTime && (
                <p className="text-sky-200 text-sm mb-1">{centerCard.startTime}</p>
              )}
              <h3 className="text-2xl font-display font-bold">{centerCard.title}</h3>
              <p className="text-sm mb-3 line-clamp-2 text-cream-50/80">{centerCard.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-steel to-sky" />
                  <span className="text-sm">{centerCard.creator}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-cream-50/80 gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{centerCard.likes}</span>
                  </div>
                  <button className="px-3 py-1.5 bg-steel dark:bg-sky text-cream-50 dark:text-navy rounded-xl font-semibold hover:bg-steel-600 dark:hover:bg-sky/80 transition text-sm cursor-pointer">
                    Watch Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div
          className="absolute right-16 scale-75 opacity-60 hover:opacity-80 transition cursor-pointer z-10"
          onClick={nextSlide}
        >
          <div className="relative w-64 h-40 rounded-2xl overflow-hidden shadow-md border border-cream-300/30 dark:border-navy-700/30">
            <Image
              src={rightCard.thumbnail}
              alt={rightCard.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-navy/40" />
            <div className="absolute top-2 left-2 bg-red-500 text-cream-50 px-2 py-1 rounded-lg text-xs font-semibold">Live</div>
            <div className="absolute bottom-2 left-2 text-cream-50">
              <p className="text-sm font-semibold truncate">{rightCard.title}</p>
              <p className="text-xs opacity-80">{rightCard.viewers.toLocaleString()} watching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-8 gap-3">
        {mockLiveSessions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === currentIndex
                ? "bg-steel dark:bg-sky w-8 shadow-md shadow-steel/30 dark:shadow-sky/30"
                : "bg-cream-300 dark:bg-navy-700 w-2 hover:bg-steel/50 dark:hover:bg-sky/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
