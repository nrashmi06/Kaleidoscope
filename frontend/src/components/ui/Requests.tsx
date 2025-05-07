import Image from "next/image";

interface RequestItem {
  name: string;
  location: string;
  imageUrl?: string; // New prop for custom image URLs
}

interface RequestsProps {
  requests?: RequestItem[];
  className?: string;
}

export default function Requests({ 
  requests = defaultRequests, 
  className = "" 
}: RequestsProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center text-xl font-semibold"> {/* Larger text */}
          Requests
          {requests.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-500 px-3 py-1 text-sm text-white"> {/* Larger badge */}
              {requests.length}
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-5"> {/* Increased spacing */}
        {requests.map((person, index) => (
          <div key={index} className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="h-12 w-12 overflow-hidden rounded-full"> {/* Larger avatar */}
                {person.imageUrl ? (
                  <Image
                    src={person.imageUrl}
                    alt={person.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={`/placeholder.svg?height=48&width=48&text=${person.name.charAt(0)}`}
                    alt={person.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover bg-gray-200"
                  />
                )}
              </div>
              <div className="ml-4"> {/* Increased margin */}
                <p className="text-base font-medium">{person.name}</p> {/* Larger text */}
                <p className="text-sm text-gray-500 mt-1">{person.location}</p> {/* Larger text */}
                <div className="mt-2 flex space-x-3"> {/* Increased spacing */}
                  <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
                    Accept
                  </button>
                  <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Default requests data with image examples
const defaultRequests: RequestItem[] = [
  { 
    name: "Lauraine Quintero", 
    location: "Oslo, Norway",
    imageUrl: "/janeshoots.jpg" // Example custom image
  },
  { 
    name: "Belinda Londema", 
    location: "Paris, France",
    imageUrl: "/person2.jpg" // Example custom image
  },
];