export function BriefLoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <p className="text-gray-600 text-sm">Your CMO is reviewing today's numbers...</p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-24 rounded-lg bg-gray-100 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
