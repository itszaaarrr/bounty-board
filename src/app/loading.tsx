export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-middle" />
        <p className="mt-4 text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}
