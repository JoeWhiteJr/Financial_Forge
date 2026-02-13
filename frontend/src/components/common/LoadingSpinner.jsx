export default function LoadingSpinner({ message = 'Loading...', fullPage = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-forge-200 border-t-forge-500 rounded-full animate-spin" />
      <p className="text-forge-500 text-sm font-medium">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {spinner}
    </div>
  );
}
