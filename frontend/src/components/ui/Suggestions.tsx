"use client";

import Image from "next/image";
import { Plus, Check, User } from "lucide-react";
import { useState } from "react";

interface SuggestionItem {
  name: string;
  location: string;
  imagePath: string;
}

interface SuggestionsProps {
  suggestions?: SuggestionItem[];
  className?: string;
}

export default function Suggestions({
  suggestions = defaultSuggestions,
  className = "",
}: SuggestionsProps) {
  const [addedIndices, setAddedIndices] = useState<number[]>([]);
  const [viewAll, setViewAll] = useState(false);

  const displayedSuggestions = viewAll ? suggestions : suggestions.slice(0, 5);

  const handleAdd = (index: number) => {
    if (!addedIndices.includes(index)) {
      setAddedIndices([...addedIndices, index]);
    }
  };

  return (
    <div className={`mb-4 md:mb-8 ${className}`}>
      <div className="mb-2 md:mb-4 flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold">Suggestions</h2>
      </div>

      <div className="space-y-3 md:space-y-4">
        {displayedSuggestions.map((person, index) => {
          return (
            <div 
              key={index} 
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={person.imagePath}
                    alt={person.name}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-2 md:ml-3 flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium truncate">{person.name}</p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">{person.location}</p>
                </div>
              </div>
              <button
                className="ml-2 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors "
                onClick={() => handleAdd(index)}
                disabled={addedIndices.includes(index)}
                aria-label={addedIndices.includes(index) ? "Added" : "Add person"}
              >
                {addedIndices.includes(index) ? (
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                ) : (
                  <div className="relative">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    <Plus className="h-2.5 w-2.5 md:h-3 md:w-3 absolute -top-1 -right-1 bg-blue-500 text-white rounded-full" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 md:mt-4 text-center">
        <button
          onClick={() => setViewAll(!viewAll)}
          className="text-xs md:text-sm text-blue-500 hover:underline font-medium"
        >
          {viewAll ? "View Less" : "View All"}
        </button>
      </div>
    </div>
  );
}

const defaultSuggestions: SuggestionItem[] = [
  { name: "Chantal Shelburne", location: "Miami, FL, US", imagePath: "/person8.jpg" },
  { name: "Marci Senter", location: "New York, NY, US", imagePath: "/person2.jpg" },
  { name: "Janetta Rotolo", location: "San Diego, CA, US", imagePath: "/person3.jpg" },
  { name: "Tyra Dhillon", location: "Springfield, MA, US", imagePath: "/person4.jpg" },
  { name: "Mariella Wigington", location: "Orlando, FL, US", imagePath: "/person5.jpg" },
  { name: "Alexei Braun", location: "Austin, TX, US", imagePath: "/person6.jpg" },
  { name: "Lara Park", location: "Chicago, IL, US", imagePath: "/person7.jpg" },
];