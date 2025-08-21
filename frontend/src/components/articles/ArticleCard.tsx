import React, { useMemo } from "react";

interface ArticleCardProps {
  title: string;
  views: number;
}

const gradients = [
  "from-purple-800 via-pink-600 to-yellow-500",
  "from-teal-700 via-cyan-500 to-indigo-500",
  "from-fuchsia-700 via-purple-500 to-blue-500",
  "from-green-700 via-lime-500 to-yellow-400",
  "from-red-700 via-orange-500 to-yellow-500",
];

export const ArticleCard: React.FC<ArticleCardProps> = ({ title, views }) => {
  // Random gradient per instance
  const background = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * gradients.length);
    return gradients[randomIndex];
  }, []);

  return (
    <div
      className={`relative w-86 h-[30rem] overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br ${background} text-white`}
    >
      {/* Gloss layer */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] rounded-3xl pointer-events-none" />

      {/* Curved light streak */}
      <div className="absolute -right-24 top-0 h-full w-44 bg-white/20 rounded-full blur-[90px] rotate-12" />
      <div className="absolute -right-20 top-0 h-full w-32 bg-white/10 rounded-full blur-2xl rotate-12" />

      {/* View counter */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 text-black px-3 py-1 rounded-full text-sm font-semibold z-10">
        {/* Eye icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {views}
      </div>

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        <div className="flex-1" />

        <div className="mb-10">
          <h2 className="text-3xl font-extrabold leading-snug tracking-wide whitespace-pre-line drop-shadow-md">
            {title}
          </h2>
        </div>

        <button className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all shadow-md">
          Read Now
        </button>
      </div>
    </div>
  );
};
