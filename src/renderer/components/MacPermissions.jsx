import { useEffect, useState } from 'react';
export default function MacPermissions() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const refresh = () => window.macPermissions?.status().then(setStatus).catch(err => setError(err.message));
  useEffect(() => { refresh(); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, []);
  if (!status?.supported) return null;
  const missing = status.screen !== 'granted' || !status.accessibility;
  if (!missing && !error) return null;
  async function open(kind) { try { await window.macPermissions.open(kind); await refresh(); } catch (err) { setError(err.message); } }
  return <section role="status" className="border-b border-amber-300 bg-amber-50 p-3 text-xs text-stone-800">
    <strong>Permisos de macOS</strong>
    <p>Autoriza LogYourTime Mac Prototype en Ajustes del Sistema → Privacidad y seguridad. Después de cambiar el permiso de pantalla, cierra y abre la aplicación.</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {status.screen !== 'granted' && <button onClick={() => open('screen')} className="rounded border px-2 py-1">Permitir capturas de pantalla</button>}
      {!status.accessibility && <button onClick={() => open('accessibility')} className="rounded border px-2 py-1">Permitir accesibilidad</button>}
      <button onClick={refresh} className="rounded border px-2 py-1">Comprobar permisos</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
