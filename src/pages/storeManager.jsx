import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../lib/axiosInstance';

const StoreManager = ({ overlayToken }) => {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState([]);

  const { data } = useQuery({
    queryKey: ['storeProducts', overlayToken],
    queryFn: async () => {
      const res = await api.get(`/api/overlay/store/${overlayToken}`);
      return res.data.products || [];
    }
  });

  useEffect(() => { if (data) setProducts(data); }, [data]);

  const saveMutation = useMutation({
    mutationFn: (newProducts) => 
      api.put(`/api/overlay/store/${overlayToken}`, { products: newProducts }),
    onSuccess: () => queryClient.invalidateQueries(['storeProducts', overlayToken])
  });

  const addProduct = () => {
    setProducts([...products, {
      name: '',
      price: 0,
      imageUrl: '',
      link: '',
      description: ''
    }]);
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-none border">
        <h2 className="text-2xl font-black mb-2">Toko OBS</h2>
        <p className="text-slate-500">Produk akan muncul secara statis di OBS</p>

        <button
          onClick={addProduct}
          className="mt-6 w-full py-3 border-2 border-dashed border-blue-500 text-blue-600 font-black rounded-none hover:bg-blue-50"
        >
          + Tambah Produk
        </button>

        <div className="mt-6 space-y-6">
          {products.map((p, i) => (
            <div key={i} className="border p-5 bg-slate-50 dark:bg-slate-800 space-y-4">
              <div className="flex justify-between">
                <h4 className="font-black">Produk #{i+1}</h4>
                <button onClick={() => removeProduct(i)} className="text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>

              <input
                placeholder="Nama Produk"
                value={p.name}
                onChange={e => updateProduct(i, 'name', e.target.value)}
                className="w-full p-3 border rounded-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Harga (Rp)"
                  value={p.price}
                  onChange={e => updateProduct(i, 'price', Number(e.target.value))}
                  className="p-3 border rounded-none"
                />
                <input
                  placeholder="https://link-produk.com"
                  value={p.link}
                  onChange={e => updateProduct(i, 'link', e.target.value)}
                  className="p-3 border rounded-none"
                />
              </div>

              <input
                placeholder="URL Gambar Produk"
                value={p.imageUrl}
                onChange={e => updateProduct(i, 'imageUrl', e.target.value)}
                className="w-full p-3 border rounded-none"
              />

              <textarea
                placeholder="Deskripsi singkat (opsional)"
                value={p.description}
                onChange={e => updateProduct(i, 'description', e.target.value)}
                className="w-full p-3 border rounded-none h-20"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => saveMutation.mutate(products)}
          disabled={saveMutation.isPending}
          className="mt-8 w-full py-4 bg-blue-600 text-white font-black rounded-none"
        >
          {saveMutation.isPending ? 'Menyimpan...' : '💾 Simpan Semua Produk'}
        </button>
      </div>
    </div>
  );
};

export default StoreManager;