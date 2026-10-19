
import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ChatPanel({ rideId, role = "USER", onClose }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const isDriver = role === "DRIVER";
  const basePath = isDriver
    ? `/api/rides/${rideId}/messages`
    : `/api/user/rides/${rideId}/messages`;

  const request = useCallback(
    async (path, options = {}) => {
      const token = sessionStorage.getItem(
        isDriver ? "driverAccessToken" : "userAccessToken"
      );

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Chat request failed");
      }

      return result;
    },
    [isDriver]
  );

  const loadMessages = useCallback(async () => {
    try {
      const result = await request(basePath);
      setMessages(Array.isArray(result.data) ? result.data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load messages");
    }
  }, [basePath, request]);

  useEffect(() => {
    loadMessages();
    const intervalId = setInterval(loadMessages, 3000);

    return () => clearInterval(intervalId);
  }, [loadMessages]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");

    try {
      await request(basePath, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });

      setMessage("");
      await loadMessages();
    } catch (err) {
      setError(err.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#191919] text-white">
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h3 className="font-bold text-yellow-400">
            💬 {isDriver ? "Chat with Customer" : "Chat with Driver"}
          </h3>
          <p className="mt-1 text-xs text-gray-400">Ride #{rideId}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
        >
          Close ✕
        </button>
      </header>

      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((item, index) => {
          const sender = String(
            item.sender_type ?? item.senderType ?? ""
          ).toUpperCase();

          const mine = sender === role;

          return (
            <div
              key={item.id ?? `${item.created_at}-${index}`}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white"
                }`}
              >
                <p className="break-words text-sm">
                  {item.message ?? item.content}
                </p>

                <p className="mt-1 text-xs opacity-70">
                  {mine ? "You" : sender === "DRIVER" ? "Driver" : "Customer"}
                  {item.created_at
                    ? ` · ${new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type your message..."
          maxLength={1000}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101010] px-3 py-3 text-sm outline-none focus:border-yellow-400"
        />

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="rounded-xl bg-yellow-400 px-4 font-bold text-black disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
