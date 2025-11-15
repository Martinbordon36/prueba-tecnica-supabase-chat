"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function NewConversationModal({ onClose, onCreated, user, onSelectConversation }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("direct");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("id, email");
    if (!error) setUsers(data.filter((u) => u.id !== user.id));
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;
    setLoading(true);
  
    // Chat directo, pero seleccionó más de una persona → grupo automático
    const isGroup = type === "group" || selectedUsers.length > 1;
    const finalTitle = isGroup
      ? (title.trim() === "" ? "Grupo sin nombre" : title)
      : null;
  
    try {
      // 🚫 Si es chat directo y ya existe → abrirlo
      if (!isGroup) {
        const otherUserId = selectedUsers[0];
  
        const { data: existing } = await supabase
          .from("conversations")
          .select(`
            id,
            type,
            conversation_members ( user_id )
          `)
          .eq("type", "direct");
  
        const match = existing?.find((c) => {
          const ids = c.conversation_members.map((m) => m.user_id);
          return ids.includes(user.id) && ids.includes(otherUserId);
        });
  
        if (match) {
          onSelectConversation(match);
          await onCreated();
          onClose();
          setLoading(false);
          return;
        }
      }
  
      //  Crear conversación
      const { data: convo, error: convError } = await supabase
        .from("conversations")
        .insert([
          {
            created_by: user.id,
            type: isGroup ? "group" : "direct",
            title: finalTitle,
          },
        ])
        .select()
        .single();
  
      if (convError) throw convError;
  
      //  Insertar usuarios
      const members = [
        { conversation_id: convo.id, user_id: user.id },
        ...selectedUsers.map((uid) => ({
          conversation_id: convo.id,
          user_id: uid,
        })),
      ];
  
      await supabase.from("conversation_members").insert(members);
  
      await onCreated();
      onSelectConversation(convo);
      onClose();
    } catch (err) {
      console.error(err);
    }
  
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[400px] max-w-[90%] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Nuevo Chat</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-gray-600">Tipo de chat</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="direct">Chat directo</option>
            <option value="group">Grupo</option>
          </select>

          {type === "group" && (
            <div>
              <label className="block text-sm text-gray-600">Nombre del grupo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Ej: Proyecto nuevo"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600">Seleccionar usuarios</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mt-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`px-3 py-2 cursor-pointer ${
                    selectedUsers.includes(u.id)
                      ? "bg-[#00A884]/20"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => toggleUser(u.id)}
                >
                  {u.email}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-[#00A884] hover:bg-[#008069] text-white py-2 rounded-lg mt-4"
          >
            {loading ? "Creando..." : "Crear Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
