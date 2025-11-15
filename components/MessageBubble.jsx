export default function MessageBubble({ message, userId, isGroup }) {
    const isMe = message.user_id === userId;
  
    return (
      <div className={`flex w-full mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm
            ${isMe ? "bg-[#D9FDD3] rounded-br-none" : "bg-white rounded-bl-none"}
          `}
        >
          {/* Nombre del remitente en grupos */}
          {isGroup && !isMe && (
            <p className="text-[11px] font-semibold text-blue-700 mb-1">
              {message.sender?.email?.split("@")[0] || "Usuario"}
            </p>
          )}
  
  
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
  
          <div
            className={`text-[10px] mt-1 ${isMe ? "text-right text-gray-600" : "text-left text-gray-500"
              }`}
          >
            {new Date(message.created_at).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }
  