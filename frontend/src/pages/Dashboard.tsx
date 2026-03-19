export function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Materia prima" value="OK" />
        <Card title="Producción" value="Próximo" />
        <Card title="Fermentación/BBT" value="Próximo" />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-black/5 p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-xl font-semibold mt-2">{value}</div>
    </div>
  );
}
