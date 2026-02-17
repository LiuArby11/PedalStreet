export default function ActionProgressBar({ active }) {
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[300] h-1 overflow-hidden">
      <div className="h-full w-full bg-orange-600/20">
        <div className="h-full w-full bg-orange-600 animate-pulse" />
      </div>
    </div>
  );
}
