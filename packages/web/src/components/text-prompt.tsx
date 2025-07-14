import { useState } from "react";

export const TextPromptComponent = ({
  title,
  onSubmit,
  onCancel,
}: {
  title: string;

  onSubmit: (text: string) => void;
  onCancel: () => void;
}) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() === "") {
      return;
    }
    onSubmit(text);
    setText("");
  };

  return (
    <div onClick={onCancel} className="fixed inset-0 z-[1000]">
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg"
        style={{ zIndex: 11111 }}
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <input
          autoFocus
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
              e.preventDefault();
            }
          }}
          className="border p-2 w-full mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
