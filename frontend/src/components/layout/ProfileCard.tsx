import Image from "next/image";

export default function ProfileCard() {
  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden bg-white dark:bg-neutral-900 rounded-xl shadow-md">
      <div className="relative h-16 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        <Image
          src="/nature1.jpg"
          alt="Profile header background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Avatar */}
      <div className="relative -top-6 left-1/2 -translate-x-1/2 transform overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-neutral-900 w-20 h-20">
        <Image
          src="/person4.jpg"
          alt="User Avatar"
          fill
          className="object-cover object-center"
          sizes="80px"
        />
      </div>

      <div className="pb-4 px-6 text-center">
        {/* User Name */}
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Barbara</h4>

        {/* Stats */}
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">250</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">2022</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">590</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Following</div>
          </div>
        </div>
      </div>
    </div>
  );
}
