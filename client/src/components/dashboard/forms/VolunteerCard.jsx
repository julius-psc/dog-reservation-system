const VolunteerCardOutlined = () => {
  return (
    <div className="p-6 w-1/2 my-4 bg-white rounded-lg shadow-md dark:bg-gray-800 relative">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
        <div className="h-6 w-24 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
      </div>

      {/* Volunteer Info Section */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-24 h-24 border-2 border-gray-200 rounded-full dark:border-gray-700 animate-pulse"></div>
        <div className="space-y-3 flex-1">
          <div className="h-6 w-48 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
          <div className="h-4 w-64 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
          <div className="h-4 w-36 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="h-4 w-20 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse mb-2"></div>
          <div className="h-6 w-32 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
        </div>
        <div>
          <div className="h-4 w-20 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse mb-2"></div>
          <div className="h-6 w-32 border-2 border-gray-200 rounded dark:border-gray-700 animate-pulse"></div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Carte de bénévole
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Badge promeneur bientôt disponible! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerCardOutlined;
