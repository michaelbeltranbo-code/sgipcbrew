import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import type { RawMaterialType } from "../types/raw-material";

type CreateRawMaterialBody = {
  type: RawMaterialType;
  name: string;
  quantity: number;
  unit: string;
  lot: string;
  supplier: string;
};

export function RawMaterials() {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateRawMaterialBody>({
    type: "malta",
    name: "",
    quantity: 0,
    unit: "kg",
    lot: "",
    supplier: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "quantity"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await http.post("/raw-materials", form);

    alert("Materia prima registrada");

    setForm({
      type: "malta",
      name: "",
      quantity: 0,
      unit: "kg",
      lot: "",
      supplier: "",
    });
  };

  return (
    <div className="flex justify-center mt-12">

      <div className="w-full max-w-xl bg-white border rounded-2xl p-6 shadow-sm">

        <h1 className="text-2xl font-bold text-center mb-6">
          Registro de Materia Prima
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="malta">Malta</option>
            <option value="lupulo">Lúpulo</option>
            <option value="levadura">Levadura</option>
            <option value="adjunto">Adjunto</option>
          </select>

          <input
            name="name"
            placeholder="Nombre"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          <input
            name="quantity"
            type="number"
            placeholder="Cantidad"
            value={form.quantity}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          <input
            name="unit"
            placeholder="Unidad"
            value={form.unit}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          <input
            name="lot"
            placeholder="Lote"
            value={form.lot}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          <input
            name="supplier"
            placeholder="Proveedor"
            value={form.supplier}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700"
          >
            Registrar
          </button>

        </form>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/raw-materials/inventory")}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-700"
          >
            Inventario
          </button>
        </div>

      </div>

    </div>
  );
}