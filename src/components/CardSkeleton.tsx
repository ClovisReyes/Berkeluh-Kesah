export function CardSkeleton() {
  return (
    <div className="p-6 bg-white border-2 border-black rounded-[5px] shadow-[4px_4px_0px_0px_#000000] animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-1/2">
          <div className="h-3.5 bg-gray-200 rounded-[3px] w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded-[3px] w-1/2"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded-[3px] w-1/4"></div>
      </div>
      <div className="space-y-2 py-2">
        <div className="h-4 bg-gray-200 rounded-[3px] w-full"></div>
        <div className="h-4 bg-gray-200 rounded-[3px] w-5/6"></div>
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-7 bg-gray-200 rounded-[3px] w-14"></div>
        <div className="h-7 bg-gray-200 rounded-[3px] w-14"></div>
      </div>
    </div>
  )
}
