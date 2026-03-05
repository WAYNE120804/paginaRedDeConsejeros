import { PageShell } from '@/components/ui/page-shell';

export default function PersonProfilePlaceholder({ params }: { params: { student_code: string } }) {
  return (
    <PageShell>
      <section className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Perfil público: {params.student_code}</h1>
        <p className="mt-2 text-sm text-slate-500">El perfil con timeline de mandatos se implementará en subfases posteriores.</p>
      </section>
    </PageShell>
  );
}
