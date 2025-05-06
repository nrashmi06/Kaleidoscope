// components/ProfileInfo.tsx
import Image from 'next/image';

export default function ProfileInfo() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Profile Picture */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-pink-300 transition-all duration-300" />
          <Image
            src="/person.jpg"
            alt="Cyndy Lillibridge"
            width={120}
            height={120}
            className="rounded-full object-cover w-24 h-24 sm:w-32 sm:h-32 border-2 border-white shadow-md"
          />
        </div>

        {/* Profile Details */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="space-y-1">
            <h1 className="text-xl font-light tracking-tight">Cyndy Lillibridge</h1>
            <p className="text-sm text-gray-600">Torrance, CA, United States</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start space-x-6 text-sm">
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-semibold text-gray-900">368</span>
              <span className="text-gray-500">Posts</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-semibold text-gray-900">184.3K</span>
              <span className="text-gray-500">Followers</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-semibold text-gray-900">1.04M</span>
              <span className="text-gray-500">Following</span>
            </div>
          </div>

          {/* Bio - Instagram-like */}
          <p className="text-sm hidden sm:block">
            Photography enthusiast • Travel addict • 
            <br />
            Capturing life's beautiful moments ✨
          </p>
        </div>
      </div>

      {/* Mobile Bio */}
      <p className="text-sm mt-3 text-center sm:hidden">
        Photography enthusiast • Travel addict • Capturing moments ✨
      </p>

    </div>
  );
}