export default function ProfileSection() {
  return (
    <div className="flex flex-col items-center space-y-3 pb-6 p-6">
      <div className="relative">
        <img src="/nature2.jpg" className="h-16 w-16 rounded-full" alt="Profile" />
        <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-blue-500 border-2 border-white"></div>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Cyndy Lillibridge</h2>
        <p className="text-sm text-gray-500">Portland, CA, United States</p>
      </div>
      <div className="flex w-full justify-between text-center">
        <div className="flex flex-col">
          <span className="font-semibold">368</span>
          <span className="text-xs text-gray-500">Posts</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">184.3K</span>
          <span className="text-xs text-gray-500">Followers</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">1.04M</span>
          <span className="text-xs text-gray-500">Following</span>
        </div>
      </div>
    </div>
  );
}