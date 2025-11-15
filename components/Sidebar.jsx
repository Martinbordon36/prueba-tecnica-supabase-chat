"use client";
import { useState } from "react";
import { LogOut, MessageCircleMore, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import NewConversationModal from "@/components/NewConversationModal";
import { useRouter } from "next/navigation";

export default function Sidebar({
    user,
    conversations,
    onSelectConversation,
    onRefresh,
    onDeleteConversation
}) {
    const { signOut } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="flex flex-col w-[30%] bg-[#F0F2F5] border-r border-gray-300 h-screen">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#EDEDED] border-b border-gray-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00A884] text-white flex items-center justify-center font-bold uppercase">
                        {user.email?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                            {user.email?.split("@")[0]}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="p-2 rounded-full hover:bg-gray-200"
                        onClick={() => setIsModalOpen(true)}
                        title="Nuevo chat"
                    >
                        <Plus className="w-5 h-5 text-gray-700" />
                    </button>

                    <button
                        className="p-2 rounded-full hover:bg-gray-200"
                        onClick={async () => {
                            await signOut();
                            router.replace("/login"); 
                        }}
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <p className="text-center text-gray-400 mt-10">
                        No hay conversaciones todavía.
                    </p>
                ) : (
                    <ul>
                        {conversations.map((c) => {
                            const displayName =
                                c.type === "group"
                                    ? c.title || "Grupo sin nombre"
                                    : c.otherUser?.email?.split("@")[0] || "Usuario desconocido";

                            // LÓGICA: MENSAJES NO LEÍDOS

                            const myMembership = c.conversation_members.find(
                                (m) => m.user_id === user.id
                            );

                            const lastRead = myMembership?.last_read_at;
                            const lastMessage = c.last_message_at; 

                            const hasUnread =
                                lastMessage &&
                                (!lastRead || new Date(lastMessage) > new Date(lastRead));

                            return (
                                <li
                                    key={c.id}
                                    className="px-4 py-3 hover:bg-gray-200 cursor-pointer transition-all flex items-center gap-3"
                                    onClick={() => onSelectConversation(c)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center">
                                        <MessageCircleMore className="w-5 h-5" />
                                    </div>

                                    <div className="flex flex-col">
                                        <p className="font-medium text-gray-800 flex items-center gap-2">
                                            {displayName}

                                            {/* 🔵 Notificación */}
                                            {hasUnread && (
                                                <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
                                            )}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {c.type === "group" ? "Grupo" : "Chat directo"}
                                        </p>
                                    </div>

                                    {/* 🗑 BORRAR */}
                                    <div className="ml-auto pr-2">
                                        <Trash2
                                            className="w-4 h-4 text-red-500 hover:text-red-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteConversation(c);
                                            }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
               <NewConversationModal
               onClose={() => setIsModalOpen(false)}
               onCreated={onRefresh}
               user={user}
               onSelectConversation={onSelectConversation}
             />
             
            )}
        </div>
    );
}
