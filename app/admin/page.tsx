"use client";
import { useEffect, useState } from "react";

export default function AdminPage(){
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [bps, setBps] = useState(100);

  async function loadUsers(){
    const r = await fetch("/api/admin/users/list");
    if(r.ok) setUsers(await r.json());
  }
  useEffect(()=>{ loadUsers(); }, []);

  async function createUser(){
    const r = await fetch("/api/admin/users", { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, name, password, commissionBps: Number(bps) })
    });
    if(r.ok){ setEmail(""); setName(""); setPassword(""); loadUsers(); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-medium">Crear cliente</h2>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
          <input placeholder="Comisión (bps)" value={bps} onChange={e=>setBps(Number(e.target.value)||0)} />
        </div>
        <button onClick={createUser} className="bg-green-600 text-white px-4 py-2 rounded-lg">Crear</button>
      </section>

      <section className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-medium mb-2">Usuarios</h2>
        <table className="w-full text-sm">
          <thead><tr><th className="text-left">Email</th><th>Nombre</th><th>Rol</th><th>BPS</th></tr></thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id}><td>{u.email}</td><td>{u.name}</td><td>{u.role}</td><td>{u.commissionBps}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
