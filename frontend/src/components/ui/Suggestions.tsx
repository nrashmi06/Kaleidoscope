// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { Plus, Check } from "lucide-react";
// import { useState } from "react";

// interface SuggestionItem {
//   name: string;
//   location: string;
//   imagePath: string;
// }

// interface SuggestionsProps {
//   suggestions?: SuggestionItem[];
//   className?: string;
// }

// export default function Suggestions({
//   suggestions = defaultSuggestions,
//   className = "",
// }: SuggestionsProps) {
//   const [shownSuggestions, setShownSuggestions] = useState(suggestions.slice(0, 5));
//   const [remainingSuggestions, setRemainingSuggestions] = useState(suggestions.slice(5));
//   const [addedIndices, setAddedIndices] = useState<number[]>([]);
//   const [viewAll, setViewAll] = useState(false);

//   const handleAdd = (index: number) => {
//     setAddedIndices([...addedIndices, index]);

//     if (remainingSuggestions.length > 0) {
//       const nextSuggestion = remainingSuggestions[0];
//       const updatedRemaining = remainingSuggestions.slice(1);

//       const updatedShown = [...shownSuggestions];
//       updatedShown[index] = nextSuggestion;

//       setShownSuggestions(updatedShown);
//       setRemainingSuggestions(updatedRemaining);
//       setAddedIndices((prev) => prev.filter((i) => i !== index)); // Reset icon for new item
//     }
//   };

//   return (
//     <div className={`mb-8 ${className}`}>
//       <div className="mb-4 flex items-center justify-between">
//         <h2 className="text-lg font-semibold">Suggestions</h2>
//       </div>

//       <div className="space-y-4">
//         {(viewAll ? suggestions : shownSuggestions).map((person, index) => (
//           <div key={index} className="flex items-center justify-between">
//             <div className="flex items-center">
//               <div className="h-11 w-11 overflow-hidden rounded-full">
//                 <Image
//                   src={person.imagePath}
//                   alt={person.name}
//                   width={44}
//                   height={44}
//                   className="h-full w-full object-cover"
//                 />
//               </div>
//               <div className="ml-3">
//                 <p className="text-base font-medium">{person.name}</p>
//                 <p className="text-sm text-gray-500">{person.location}</p>
//               </div>
//             </div>
//             {!viewAll && (
//               <button
//                 className="text-blue-500 hover:text-blue-600"
//                 onClick={() => handleAdd(index)}
//               >
//                 {addedIndices.includes(index) ? (
//                   <Check className="h-5 w-5 text-green-500" />
//                 ) : (
//                   <Plus className="h-5 w-5" />
//                 )}
//               </button>
//             )}
//           </div>
//         ))}
//       </div>

//       {!viewAll && (
//         <div className="mt-4 text-center">
//           <button
//             onClick={() => setViewAll(true)}
//             className="text-sm text-blue-500 hover:underline"
//           >
//             View All
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// const defaultSuggestions: SuggestionItem[] = [
//   { name: "Chantal Shelburne", location: "Miami, FL, US", imagePath: "/person8.jpg" },
//   { name: "Marci Senter", location: "New York, NY, US", imagePath: "/person2.jpg" },
//   { name: "Janetta Rotolo", location: "San Diego, CA, US", imagePath: "/person3.jpg" },
//   { name: "Tyra Dhillon", location: "Springfield, MA, US", imagePath: "/person4.jpg" },
//   { name: "Mariella Wigington", location: "Orlando, FL, US", imagePath: "/person5.jpg" },
//   { name: "Alexei Braun", location: "Austin, TX, US", imagePath: "/person6.jpg" },
//   { name: "Lara Park", location: "Chicago, IL, US", imagePath: "/person7.jpg" },
// ];
"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
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
    <div className={`mb-8 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Suggestions</h2>
      </div>

      <div className="space-y-4">
        {displayedSuggestions.map((person, index) => {
          const globalIndex = viewAll ? index : index;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-11 w-11 overflow-hidden rounded-full">
                  <Image
                    src={person.imagePath}
                    alt={person.name}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium">{person.name}</p>
                  <p className="text-sm text-gray-500">{person.location}</p>
                </div>
              </div>
              <button
                className="text-blue-500 hover:text-blue-600"
                onClick={() => handleAdd(index)}
                disabled={addedIndices.includes(index)}
              >
                {addedIndices.includes(index) ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setViewAll(!viewAll)}
          className="text-sm text-blue-500 hover:underline"
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
