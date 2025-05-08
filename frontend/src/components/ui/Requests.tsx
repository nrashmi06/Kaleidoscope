import Image from "next/image";

interface RequestItem {
  name: string;
  location: string;
  imageUrl?: string;
}

interface RequestsProps {
  requests?: RequestItem[];
  className?: string;
}

export default function Requests({
  requests = defaultRequests,
  className = "",
}: RequestsProps) {
  return (
    <div className={`mb-4 md:mb-6 ${className}`}>
      <div className="mb-2 md:mb-3 flex items-center justify-between">
        <h2 className="flex items-center text-sm md:text-base font-semibold">
          Requests
          {requests.length > 0 && (
            <span className="ml-1.5 md:ml-2 rounded-full bg-blue-500 px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs text-white">
              {requests.length}
            </span>
          )}
        </h2>
      </div>
      
      <div className="space-y-3 md:space-y-4">
        {requests.map((person, index) => (
          <div
            key={index}
            className="flex items-start space-x-2 md:space-x-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
          >
            <div className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 overflow-hidden rounded-full">
              <Image
                src={person.imageUrl || `/placeholder.svg?height=40&width=40&text=${person.name.charAt(0)}`}
                alt={person.name}
                width={40}
                height={40}
                className="h-full w-full object-cover bg-gray-200"
              />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 w-full">
  <div className="flex-1 min-w-0">
    <p className="text-xs md:text-sm font-medium truncate">{person.name}</p>
    <p className="text-[10px] md:text-xs text-gray-500 truncate">{person.location}</p>
  </div>

  <div className="flex flex-shrink-0 gap-2 mt-1 sm:mt-0 w-full sm:w-auto justify-end">
    <button className="rounded bg-blue-50 hover:bg-blue-100 px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium text-blue-600 transition-colors">
      Accept
    </button>
    <button className="rounded bg-red-50 hover:bg-red-100 px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium text-red-600 transition-colors">
      Decline
    </button>
  </div>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}

const defaultRequests: RequestItem[] = [
  {
    name: "Lauraine Quintero",
    location: "Oslo, Norway",
    imageUrl: "/janeshoots.jpg",
  },
  {
    name: "Belinda Londema",
    location: "Paris, France",
    imageUrl: "/person2.jpg",
  },
];