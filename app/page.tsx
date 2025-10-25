"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState<number | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [timer, setTimer] = useState<number>(4);
  const [paused, setPaused] = useState<boolean>(false);
  const intervalRef = useRef<any>(null);
  const isFetchingRef = useRef(false);

  // 🔁 Solicita cotización desde /api/quotes (protegido contra solapes)
  async function getQuote() {
    if (paused) return;
    if (!amount || amount <= 0) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("RFQ error:", data?.error || data);
        return;
      }
      setQuote(data);
      setTimer(4); // UI: quote válida por 4s (recotizamos después)
    } catch (err) {
      console.error("Error solicitando cotización:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }

  // ⏱️ Disparar recotización automática cada 4 s mientras NO esté pausado
  useEffect(() => {
    // Si cambia el monto, reinicia ciclo
    clearInterval(intervalRef.current);
    if (amount && amount > 0 && !paused) {
      // primer fetch inmediato
      getQuote();
      // luego cada 4s
      intervalRef.current = setInterval(getQuote, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [amount, paused]);

  // ✅ Ejecutar conversión (Aceptar)
  async function handleAccept() {
    if (!quote?.bitso_quote_id) {
      alert("No hay cotización activa.");
      return;
    }
    if (timer <= 0) {
      alert("La cotización expiró. Espera la siguiente actualización.");
      return;
    }

    // Pausar recotización durante la ejecución
    setPaused(true);
    clearInterval(intervalRef.current);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: quote.bitso_quote_id })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`No se pudo ejecutar la conversión: ${data?.error || "Error desconocido"}`);
        // reanudar ciclo
        setPaused(false);
        intervalRef.current = setInterval(getQuote, 4000);
        return;
      }

      const folio = data?.folio || Math.floor(Math.random() * 1_000_000_000).toString();
      alert(`✅ Conversión ejecutada.\nFolio interno: ${folio}`);
    } catch (err) {
      console.error("Error ejecutando conversión:", err);
      alert("Ocurrió un error al ejecutar la conversión.");
      // reanudar ciclo
      setPaused(false);
      intervalRef.current = setInterval(getQuote, 4000);
    }
  }

  // ❌ Rechazar cotización (detiene recotización)
  function handleDecline() {
    setPaused(true);
    clearInterval(intervalRef.current);
    setQuote(null);
  }

  // ⏳ Temporizador visual (4→0 cada segundo)
  useEffect(() => {
    if (!quote || paused) return;
    const t = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [quote, paused]);

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-700">
          Comprar USDT con MXN
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Monto en MXN
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2 text-right"
            placeholder="Ingresa monto"
            value={amount ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAmount(Number.isFinite(v) ? v : null);
              // si estaba pausado (por decline/accept), al cambiar monto reanudamos
              setPaused(false);
            }}
          />
        </div>

        <button
          onClick={getQuote}
          disabled={!amount || amount <= 0 || paused}
          className={`w-full py-2 rounded-lg font-semibold text-white ${
            !amount || amount <= 0 || paused
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Obtener cotización
        </button>

        {quote && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-2 text-gray-700">
              Cotización actual
            </h3>
            <p>
              <strong>{Number(quote.target_amount).toFixed(2)} USDT</strong>{" "}
              por{" "}
              <strong>{Number(quote.source_amount).toFixed(2)} MXN</strong>
            </p>
            <p className="text-sm text-gray-600">
              1 USDT = {Number(quote.rate).toFixed(6)} MXN
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Esta oferta se actualizará en {timer}s
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAccept}
                disabled={timer <= 0}
                className={`flex-1 py-2 rounded text-white ${
                  timer <= 0
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {timer <= 0 ? "Expirada" : "Aceptar"}
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
