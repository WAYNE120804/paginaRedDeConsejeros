export default function AdminDashboardPage() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {['Personas', 'Eventos', 'Noticias'].map((card) => (
        <article key={card} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">{card}</h2>
          <p className="mt-1 text-sm text-slate-500">Módulo preparado para las siguientes subfases.</p>
        </article>
      ))}
    </section>
  );
}
