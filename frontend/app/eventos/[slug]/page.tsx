import { PageShell } from '@/components/ui/page-shell';

export default function EventDetailPlaceholder({ params }: { params: { slug: string } }) {
  return (
    <PageShell>
      <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Detalle de evento: {params.slug}</h1>
        <p className="mt-2 text-sm text-slate-500">El detalle completo con galería/carrusel se implementará en la subfase 6C.</p>
      </section>
    </PageShell>
  );
}
