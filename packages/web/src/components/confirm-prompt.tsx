export const ConfirmPromptComponent = ({
  title,
  message,
  onSubmit,
  onCancel,
}: {
  title: string;
  message: string;

  onSubmit: () => void;
  onCancel: () => void;
}) => {
  return (
    <div onClick={onCancel} className="fixed inset-0 z-[1000]">
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg"
        style={{ zIndex: 11111 }}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            autoFocus
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
