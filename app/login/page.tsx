"use client";
import { useState } from "react";

export default function LoginPage(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e:any){
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/auth/login", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });
    if(res.ok){
      location.href = "/";
    } else {
      setMsg("Credenciales inválidas");
    }
  }

  return (
    <div className="max-w-md bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full"/>
        </div>
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full"/>
        </div>
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg">Entrar</button>
      </form>
    </div>
  )
}
