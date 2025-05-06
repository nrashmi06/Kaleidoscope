// import FeedList from "@/components/ui/FeedList";
// import Requests from "@/components/ui/Requests";
// import Suggestions from "@/components/ui/Suggestions";
// import ProfileInfo from "@/components/ui/ProfileInfo";
// import Followers from "@/components/ui/Followers";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {/* First Column - Profile Section (25%) */}
//       <div className="w-1/4 p-6 sticky top-0 h-screen overflow-y-auto">
//         <div className="bg-white rounded-xl shadow-sm p-6 h-full">
//           <ProfileInfo />
//         </div>
//       </div>

//       {/* Second Column - Main Content (50%) */}
//       <div className="w-2/4">
//         {/* Stories Section (White BG) */}
//         <div className="bg-white border-x border-gray-200">
//           <div className="p-6 sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200">
//             <div className="flex justify-between items-center">
//               <h2 className="text-xl font-semibold">Feed</h2>
//               <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm transition-colors">
//                 + Create new post
//               </button>
//             </div>
//           </div>
         
//         </div>

//         {/* Feed Section (Light Grey BG) */}
//         <div className="bg-gray-200 border-x border-gray-300 h-full">
//           <FeedList />
//         </div>
//       </div>

//       {/* Third Column - Suggestions (25%) */}
//       <div className="w-1/4 p-6 sticky top-0 h-screen overflow-y-auto">
//         <div className="space-y-6">
//           <div className="bg-white rounded-xl shadow-sm p-6">
//             <Requests />
//           </div>
//           <div className="bg-white rounded-xl shadow-sm p-6">
//             <Suggestions />
//           </div>
//           <div className="bg-white rounded-xl shadow-sm p-6">
//             <Followers />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';
import { useState } from "react";
import FeedList from "@/components/ui/FeedList";
import Requests from "@/components/ui/Requests";
import Suggestions from "@/components/ui/Suggestions";
import ProfileInfo from "@/components/ui/ProfileInfo";
import Followers from "@/components/ui/Followers";
import SearchAndCreate from "@/components/ui/SearchAndCreate";

export default function Home() {
  const [selected, setSelected] = useState("popular");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* First Column - Profile Section (25%) */}
      <div className="w-1/4 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 h-full">
          <ProfileInfo />
        </div>
      </div>

      {/* Second Column - Main Content (50%) */}
      <div className="w-2/4">
        {/* Search and Create Post Section */}
        <div className="bg-white border-x border-gray-200 px-6 pt-6 sticky top-0 z-20 bg-opacity-90 backdrop-blur-sm border-b border-gray-200">
          <SearchAndCreate />
        </div>

        {/* Feed Header */}
        <div className="bg-white border-x border-gray-200 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feed</h2>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selected === "popular" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setSelected("popular")}
              >
                Popular
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selected === "latest" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setSelected("latest")}
              >
                Latest
              </button>
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="bg-gray-200 border-x border-gray-300 h-full p-6">
          <FeedList />
        </div>
      </div>

      {/* Third Column - Suggestions (25%) */}
      <div className="w-1/4 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Requests />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Suggestions />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Followers />
          </div>
        </div>
      </div>
    </div>
  );
}
