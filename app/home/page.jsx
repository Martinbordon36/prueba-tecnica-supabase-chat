"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);


  // Obtengo Conversaciones con ultimos mensajes y ultimos leeidos
  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          type,
          title,
          created_by,
          created_at,

          conversation_members (
            user_id,
            hidden,
            last_read_at,
            last_cleared_at,
            profiles (id, email)
          ),

          messages (
            id,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }

      // 🔥 FILTRAR solo mis conversaciones NO ocultas (hidden = true → NO se muestra)
      const userConvos = data.filter((c) =>
        c.conversation_members.some(
          (m) => m.user_id === user.id && m.hidden !== true
        )
      );

      // 🔥 MAPEAR DATOS EXTRA: last_message_at + otherUser
      const processed = userConvos.map((convo) => {
        const lastMessageAt = convo.messages?.length
          ? convo.messages
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )[0].created_at
          : convo.created_at;

        let otherUser = null;
        if (convo.type === "direct") {
          const otherMember = convo.conversation_members.find(
            (m) => m.user_id !== user.id
          );
          otherUser = otherMember?.profiles || null;
        }

        return {
          ...convo,
          otherUser,
          last_message_at: lastMessageAt,
        };
      });

      // 🔥 ORDENAR POR ÚLTIMO MENSAJE REAL
      processed.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );

      setConversations(processed);
    } catch (err) {
      console.error("Unhandled fetchConversations error:", err);
    }
  };

// Listado
  useEffect(() => {
    if (!ready || !user) return;

    fetchConversations();

    const memberChannel = supabase
      .channel("realtime:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_members" },
        () => fetchConversations()
      )
      .subscribe();

    return () => supabase.removeChannel(memberChannel);
  }, [user, ready]);

  //  Listado de Mensajes respeta `hidden`: 
  //  si el chat está borrado para mí, no lo revive

  useEffect(() => {
    if (!ready || !user) return;
  
    const msgChannel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;
          if (!msg) return;
  
          // 1️⃣ Ver si soy miembro
          const { data: member } = await supabase
            .from("conversation_members")
            .select("hidden")
            .eq("conversation_id", msg.conversation_id)
            .eq("user_id", user.id)
            .maybeSingle();
  
          if (!member) return;
  
          // 2️⃣ Ver conversación
          const { data: convo } = await supabase
            .from("conversations")
            .select("type")
            .eq("id", msg.conversation_id)
            .maybeSingle();
  
          if (!convo) return;
  
          // ==============================
          // 🟢 CHAT DIRECTO (IMPORTANTE)
          // ==============================
          if (convo.type === "direct") {
            // SI ESTÁ OCULTO → DESOCULTAR AUTOMÁTICAMENTE
            if (member.hidden === true) {
              await supabase
                .from("conversation_members")
                .update({ hidden: false })
                .eq("conversation_id", msg.conversation_id)
                .eq("user_id", user.id);
            }
  
            fetchConversations();
            return;
          }
  
          // ==============================
          // 🔵 GRUPOS
          // ==============================
          if (convo.type === "group") {
            // grupo → si está oculto NO hacemos nada
            if (member.hidden === true) {
              return;
            }
  
            fetchConversations();
          }
        }
      )
      .subscribe();
  
    return () => supabase.removeChannel(msgChannel);
  }, [user, ready]);
  


  //Borrar Conversacion para mi unicamente
  const deleteConversation = async (conversation) => {
    if (!user) return;
  
    const confirmed = confirm(
      conversation.type === "group"
        ? "¿Seguro que querés salir de este grupo?"
        : "¿Seguro que querés borrar este chat de tu lista?"
    );
    if (!confirmed) return;
  

    //salir del grupo
    if (conversation.type === "group") {
      await supabase
        .from("conversation_members")
        .delete()
        .eq("conversation_id", conversation.id)
        .eq("user_id", user.id);
  
    } else {
        //chat directo lo borro para mi unicamente
      await supabase
        .from("conversation_members")
        .update({
          hidden: true,
          last_cleared_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversation.id)
        .eq("user_id", user.id);
    }
  
    setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
  
    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation(null);
    }
  };
  

  const handleSelectConversation = async (conversation) => {
    // 1️⃣Obtener data actualizada de la conversación
    const { data: fresh } = await supabase
      .from("conversations")
      .select(`
        id,
        type,
        title,
        created_at,
        conversation_members (
          user_id,
          profiles ( id, email )
        )
      `)
      .eq("id", conversation.id)
      .single();

    if (!fresh) return;

    // 2 Procesar otherUser (solo direct)
    let otherUser = null;
    if (fresh.type === "direct") {
      const other = fresh.conversation_members.find(
        (m) => m.user_id !== user.id
      );
      otherUser = other?.profiles || null;
    }

    // 3️⃣ Actualizar selectedConversation
    setSelectedConversation({ ...fresh, otherUser });

    // 4️⃣ Marcar como leído
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString(), hidden: false })
      .eq("conversation_id", fresh.id)
      .eq("user_id", user.id);

    // 5️⃣ Refrescar sidebar
    fetchConversations();
  };

  if (!ready)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">Cargando sesión...</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#EDEDED]">
      <Sidebar
        user={user}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onRefresh={fetchConversations}
        onDeleteConversation={deleteConversation}
      />

      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            user={user}
            onRefresh={fetchConversations}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Seleccioná un chat para comenzar
          </div>
        )}
      </div>
    </div>
  );
}
