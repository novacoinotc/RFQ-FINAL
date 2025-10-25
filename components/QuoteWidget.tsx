"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Pair = { source: string; target: string };
type QuoteResp = {
  id: string;
  bitso_quote_id: string;
  price_client: number;
  expires_at: string; // ISO string
  created_at: string; // ISO string
  status: string;
};

export default function QuoteWidget() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [source, setSource] = useState("MXN");
  const [target, setTarget] = useState("USDT");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("100000");
  const [quote, setQuote] = useState<QuoteResp | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helpers
  const isValidDate = (d?: string) =>
    !!d && !Number.isNaN(Date.parse(d));

  const safeISO = (d?: string, fallbackMs = 30_000) =>
    isValidDate(d) ? (d as string) : new Date(Date.now() + fallbackMs).toISOString();

  // Cargar pares con fallback para no romper la UI
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pairs", { cache: "no-store" });
        const d = await r.json();
        const list = (d?.pairs || d?.data || d || []) as any[];
        const mapped = list.map((p: any) => ({ source: p.source, target: p.target }));
        setPairs(mapped.length ? mapped : [{ source: "MXN", target: "USDT" }]);
      } catch {
        setPairs([{ source: "MXN", target: "USDT" }]);
      }
    })();
  }, []);

  const targets = useMemo(
    () => Array.from(new Set(pairs.filter(p => p.source === source).map(p => p.target))),
    [pairs, source]
  );

  function stop() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }
  function start(exp: string) {
    stop();
    const end = new Date(exp).getTime();
    timer.current = setInterval(() => {
      const left = end - Date.now();
      setMsLeft(Math.max(0, left));
      if (left <= 0) stop();
    }, 200);
  }

  async function getQuote() {
    try {
      setQuote(null);
      const r = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, target, side, amount })
      });
      const data = await r.json();

      // Normalizar posibles formas de respuesta
      const q: any = data?.quote ?? data?.data ?? data ?? {};

      const created_at = (q.created_at || q.createdAt || new Date().toISOString()) as string;
      const expires_at = safeISO(q.expires_at || q.expiresAt);

      const normalized: QuoteResp = {
        id: (q.id || q.internal_id || "") as string,
        bitso_quote_id: (q.bitso_quote_id || q.quote_id || "") as string,
        price_client: Number(q.price_client ?? q.price ?? q.rate ?? 0),
        created_at,
        expires_at,
        status: (q.status ?? "ACTIVE") as string
      };

      setQuote(normalized);
      start(normalized.expires_at);
    } catch (err) {
      console.error("Error getting quote:", err);
      alert("No se pudo obtener la cotización. Revisa tus llaves de Bitso o vuelve a intentar.");
    }
  }

  async function accept() {
    if (!quote?.id) return;
    try {
      const r = await fetch(`/api/quotes/${quote.id}/accept`, { method: "POST" });
      const d = await r.json();
      alert(`FOLIO: ${d.folio}\nUsa este folio en el concepto de tu transferencia.`);
    } catch (e) {
      alert("No se pudo cerrar el precio. Intenta de nuevo.");
    }
  }

  // Barra de expiración segura
  const totalMs =
    quote && isValidDate(quote.expires_at) && isValidDate(quote.created_at)
      ? new Date(quote.expires_at).getTime() - new Date(quote.created_at).getTime()
      : 0;

  const pct =
    quote && totalMs > 0
      ? Math.min(100, Math.max(0, (msLeft / totalMs) * 100))
      : 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSide("BUY")}
            className={`px-3 py-2 rounded ${side === "BUY" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            Comprar
          </button>
          <button
            onClick={() => setSide("SELL")}
            className={`px-3 py-2 rounded ${side === "SELL" ? "bg-rose-600 text-white" : "bg-gray-200"}`}
          >
            Vender
          </button>
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Monto</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">De</label>
            <select className="w-full border rounded px-2 py-2" value={source} onChange={(e) => setSource(e.target.value)}>
              {Array.from(new Set(pairs.map((p) => p.source))).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">A</label>
            <select className="w-full border rounded px-2 py-2" value={target} onChange={(e) => setTarget(e.target.value)}>
              {targets.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={getQuote} className="w-full bg-indigo-600 text-white py-2 rounded">
          Obtener cotización
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-medium mb-3">Cotización actual</h3>
        {!quote ? (
          <p className="text-sm text-gray-600">Solicita una cotización.</p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              ID Interno: <span className="font-mono">{quote.id || "—"}</span>
            </div>
            <div className="text-3xl font-semibold">
              {Number.isFinite(quote.price_client) ? quote.price_client.toFixed(6) : "—"} {source}/{target}
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-indigo-600 rounded" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-sm text-gray-600">
              Expira:{" "}
              {isValidDate(quote.expires_at)
                ? new Date(quote.expires_at).toLocaleTimeString()
                : "—"}
            </div>
            <button
              onClick={accept}
              disabled={msLeft <= 0}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            >
              Cerrar precio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
