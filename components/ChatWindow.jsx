"use client";
import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MessageBubble from "@/components/MessageBubble";

export default function ChatWindow({ conversation, user, onRefresh }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const [newTitle, setNewTitle] = useState(conversation.title || "Grupo sin nombre");

    // Marcar mensajes leeidos al abrir chat
    useEffect(() => {
        if (!conversation || !user) return;

        supabase
            .from("conversation_members")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversation.id)
            .eq("user_id", user.id);

    }, [conversation?.id]);

    // Carga de mensajes en Tiempo Real

    useEffect(() => {
        if (!conversation) return;

        fetchMessages();

        const channel = supabase
            .channel(`messages-${conversation.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversation.id}`,
                },
                async (payload) => {
                    const msg = payload.new;
                    if (!msg) return;

                    //  Si el mensaje NO es del chat actual → ignorar
                    if (msg.conversation_id !== conversation.id) return;

                    //  Si el chat ya habia sido borrado -> volver a mostrar 
                    const { data: membership } = await supabase
                        .from("conversation_members")
                        .select("hidden")
                        .eq("conversation_id", msg.conversation_id)
                        .eq("user_id", user.id)
                        .single();

                    if (membership?.hidden) {
                        await supabase
                            .from("conversation_members")
                            .update({ hidden: false })
                            .eq("conversation_id", msg.conversation_id)
                            .eq("user_id", user.id);

                        await onRefresh?.();
                    }

                    //  Traer info del usuario del mensaje
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("id, email")
                        .eq("id", msg.user_id)
                        .single();

                    // Añadir mensaje al estado
                    setMessages((prev) => [...prev, { ...msg, sender: profile }]);

                    //  Marcar mensaje como leído inmediatamente
                    await supabase
                        .from("conversation_members")
                        .update({ last_read_at: new Date().toISOString() })
                        .eq("conversation_id", conversation.id)
                        .eq("user_id", user.id);

                    onRefresh?.(); // Refrescar Sidebar (para limpiar la notificación)
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [conversation]);

    //  Fetch inicial de mensajes -> (RESPETA last_cleared_at)

    const fetchMessages = async () => {
        const { data: membership } = await supabase
            .from("conversation_members")
            .select("last_cleared_at")
            .eq("conversation_id", conversation.id)
            .eq("user_id", user.id)
            .single();

        let query = supabase
            .from("messages")
            .select(`
        id,
        content,
        created_at,
        user_id,
        sender:profiles!messages_user_id_fkey ( id, email )
      `)
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true });

        //  NO MOSTRAR MENSAJES ANTES DE last_cleared_at
        if (membership?.last_cleared_at) {
            query = query.gt("created_at", membership.last_cleared_at);
        }

        const { data } = await query;
        setMessages(data);
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    //  Enviar Mensaje
    const handleSend = async () => {
        if (!newMessage.trim()) return;

        await supabase.from("messages").insert([
            {
                conversation_id: conversation.id,
                user_id: user.id,
                content: newMessage,
            },
        ]);

        setNewMessage("");

        // Marcar mis mensajes como leídos 
        await supabase
            .from("conversation_members")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversation.id)
            .eq("user_id", user.id);

        onRefresh?.();
    };

    const saveGroupName = async () => {
        const finalTitle =
            newTitle.trim() === "" ? "Grupo sin nombre" : newTitle.trim();

        await supabase
            .from("conversations")
            .update({ title: finalTitle })
            .eq("id", conversation.id);

        // Actualizar en frontend
        conversation.title = finalTitle;
        setEditing(false);
        setNewTitle(finalTitle);

        // Refrescar sidebar
        await onRefresh?.();
    };


    return (
        <div className="flex flex-col h-screen">
            {/* HEADER */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#EDEDED] border-b border-gray-300">
                <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold uppercase">
                    {conversation.type === "direct"
                        ? conversation.otherUser?.email?.charAt(0)
                        : conversation.title?.charAt(0)}
                </div>

                <div className="flex flex-col">

                    {conversation.type === "direct" ? (
                        <span className="font-medium text-gray-800">
                            {conversation.otherUser?.email?.split("@")[0] || "Usuario"}
                        </span>
                    ) : editing ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveGroupName()}
                                className="text-sm border px-2 py-1 rounded"
                                autoFocus
                            />
                            <button
                                onClick={saveGroupName}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                            >
                                Guardar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                                {conversation.title || "Grupo sin nombre"}
                            </span>

                            <button
                                onClick={() => setEditing(true)}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Editar
                            </button>
                        </div>
                    )}

                    {/* 🟦 Miembros del grupo */}
                    {conversation.type === "group" && (
                        <span className="text-xs text-gray-500">
                            {conversation.conversation_members
                                ?.map((m) => m.profiles.email.split("@")[0])
                                .join(", ")}
                        </span>
                    )}
                </div>
            </div>



            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto bg-[#F0F2F5] px-4 py-3">
                {messages.map((m) => (
                    <MessageBubble
                        key={m.id}
                        message={m}
                        userId={user.id}
                        isGroup={conversation.type === "group"}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="flex items-center gap-2 bg-[#F0F2F5] border-t border-gray-300 px-4 py-3">
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2"
                    placeholder="Escribí un mensaje..."
                />
                <button
                    onClick={handleSend}
                    className="bg-[#00A884] hover:bg-[#008069] text-white rounded-full p-2"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
