import type { ToastMessage } from "@/types/parkwise";

export function Toasts({ messages }: { messages: ToastMessage[] }) {
  return (
    <div className="toast-stack">
      {messages.map((message) => (
        <div key={message.id} className={`toast ${message.severity}`}>
          <strong>{message.summary}</strong>
          <span>{message.detail}</span>
        </div>
      ))}
    </div>
  );
}
