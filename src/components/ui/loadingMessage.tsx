export const LoadingMessage = () => (
    <div className="flex items-center space-x-2 p-2">
      <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-blue-500"></div>
      <span className="text-sm text-gray-500">AI is thinking...</span>
    </div>
  );