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
      {/* Header */}
      <div className="mb-2 md:mb-3 flex items-center justify-between">
        <h2 className="flex items-center text-sm md:text-base font-semibold text-neutral-800 dark:text-neutral-100">
          Requests
          {requests.length > 0 && (
            <span className="ml-1.5 md:ml-2 rounded-full bg-blue-500 px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs text-white">
              {requests.length}
            </span>
          )}
        </h2>
      </div>

      {/* Request List */}
      <div className="space-y-3 md:space-y-4 overflow-hidden">
        {requests.map((person, index) => (
          <div
            key={index}
            className="flex items-start space-x-2 md:space-x-3 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {/* Avatar */}
            <div className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 overflow-hidden rounded-full">
              <Image
                src={
                  person.imageUrl ||
                  `/placeholder.svg?height=40&width=40&text=${person.name.charAt(0)}`
                }
                alt={person.name}
                width={40}
                height={40}
                className="h-full w-full object-cover bg-gray-200 dark:bg-neutral-700"
              />
            </div>

            {/* Details + Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              {/* Name and Location */}
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                  {person.name}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-neutral-400 truncate">
                  {person.location}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end sm:justify-start ">
                <button className="rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium text-blue-600 dark:text-blue-400 transition-colors">
                  Accept
                </button>
                <button className="rounded bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 px-2 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors">
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
