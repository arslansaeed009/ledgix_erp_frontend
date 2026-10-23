import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Star, Trash2, Plus } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { Card, Button, Input, Select, Textarea } from '../components/ui';
import { useCategories } from '../hooks/useCategories';

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const emptyForm = {
  name: '', brand: '', category_id: '', sku: '', barcode: '', serial_number: '',
  purchase_price: '', sale_price: '', minimum_price: '', dealer_price: '', tax_percent: '',
  stock_qty: '', reorder_level: '', location: '', warehouse_id: '', description: '',
  warranty: '', specifications: ''
};

function imageUrl(filePath) {
  return `${api.defaults.baseURL.replace('/api', '')}${filePath}`;
}

function validateImageFiles(files, currentCount) {
  if (currentCount + files.length > MAX_IMAGES) {
    return `You can upload up to ${MAX_IMAGES} images per product.`;
  }
  const invalidFile = files.find(file => !file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES);
  if (!invalidFile) return '';
  return invalidFile.size > MAX_IMAGE_BYTES
    ? 'Each image must be 8 MB or smaller.'
    : 'Only image files are allowed.';
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const { categories, canAdd, error: categoriesError, addCategory } = useCategories();
  const [warehouses, setWarehouses] = useState([]);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/warehouses').then(res => setWarehouses(res.data.warehouses));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then(res => {
      const p = res.data.product;
      setForm({ ...emptyForm, ...p });
      setImages(p.images || []);
      setLoading(false);
    });
  }, [id, isEdit]);

  const newImagesRef = useRef(newImages);
  newImagesRef.current = newImages;
  useEffect(() => {
    return () => {
      newImagesRef.current.forEach(image => {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

  async function handleAddCategory() {
    if (!newCategory.trim() || categorySaving) return;
    setError('');
    setCategorySaving(true);
    try {
      const category = await addCategory(newCategory);
      set('category_id', category.id);
      setNewCategory('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add category.'));
    } finally {
      setCategorySaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Product name is required.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/products/${id}`, form);
        navigate(`/products/${data.product.id}`);
      } else {
        let payload = form;
        if (newImages.length > 0) {
          payload = new FormData();
          Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''));
          newImages.forEach(({ file }) => payload.append('images', file));
        }
        const { data } = await api.post('/products', payload);
        navigate(`/products/${data.product.id}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save product.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const validationError = validateImageFiles(files, images.length);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data } = await api.post(`/products/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(prev => [...prev, ...data.images]);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not upload images.'));
    } finally {
      setUploading(false);
    }
  }

  function handleNewImageSelection(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const validationError = validateImageFiles(files, newImages.length);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setNewImages(current => [
      ...current,
      ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    ]);
  }

  function removeNewImage(index) {
    setNewImages(current => {
      const target = current[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  }

  async function handleDeleteImage(imgId) {
    setError('');
    try {
      await api.delete(`/products/${id}/images/${imgId}`);
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete image.'));
    }
  }

  async function handleSetPrimary(imgId) {
    setError('');
    try {
      await api.put(`/products/${id}/images/${imgId}/primary`);
      setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imgId ? 1 : 0 })));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not set primary image.'));
    }
  }

  const imageCount = isEdit ? images.length : newImages.length;
  const canAddMore = imageCount < MAX_IMAGES && !uploading;

  if (loading) return null;

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Products
      </button>

      <h1 className="font-display font-bold text-2xl text-ink-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product name" required value={form.name} onChange={e => set('name', e.target.value)} className="col-span-2" />
            <Input label="Brand" value={form.brand || ''} onChange={e => set('brand', e.target.value)} />
            <div>
              <span className="block text-xs font-semibold text-ink-700/70 mb-1.5">Category</span>
              <div className="flex gap-2">
                <Select value={form.category_id || ''} onChange={e => set('category_id', e.target.value)} className="flex-1">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              {canAdd && (
                <div className="flex gap-2 mt-2">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name"
                    className="flex-1 h-9 px-3 rounded-lg bg-surface-soft border border-surface-border text-xs outline-none focus:border-brand-500" />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddCategory} disabled={!newCategory.trim() || categorySaving}>
                    <Plus size={13} /> {categorySaving ? 'Adding…' : 'Add Category'}
                  </Button>
                </div>
              )}
              {categoriesError && <p className="text-xs text-accent-red mt-1">{categoriesError}</p>}
            </div>
            <Input label="SKU" value={form.sku || ''} onChange={e => set('sku', e.target.value)} />
            <Input label="Barcode" value={form.barcode || ''} onChange={e => set('barcode', e.target.value)} />
            <Input label="Serial number" value={form.serial_number || ''} onChange={e => set('serial_number', e.target.value)} />
            <Input label="Warranty" placeholder="e.g. 1 year" value={form.warranty || ''} onChange={e => set('warranty', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Pricing &amp; Tax</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase price" type="number" step="0.01" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
            <Input label="Sale price" type="number" step="0.01" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} />
            <Input label="Minimum price" type="number" step="0.01" value={form.minimum_price} onChange={e => set('minimum_price', e.target.value)} />
            <Input label="Dealer price" type="number" step="0.01" value={form.dealer_price} onChange={e => set('dealer_price', e.target.value)} />
            <Input label="Tax %" type="number" step="0.01" value={form.tax_percent} onChange={e => set('tax_percent', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Stock &amp; Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label={isEdit ? 'Current stock (read-only — use Inventory to change)' : 'Opening stock quantity'}
              type="number" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)} disabled={isEdit} />
            <Input label="Reorder level" type="number" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
            <Select label="Warehouse" value={form.warehouse_id || ''} onChange={e => set('warehouse_id', e.target.value)}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
            <Input label="Shelf / bin location" value={form.location || ''} onChange={e => set('location', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Description &amp; Specifications</h3>
          <div className="space-y-4">
            <Textarea label="Description" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
            <Textarea label="Specifications" rows={3} value={form.specifications || ''} onChange={e => set('specifications', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-display font-semibold text-ink-900">Product Images</h3>
            <span className="text-xs text-ink-700/50">{imageCount}/{MAX_IMAGES}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            {isEdit
              ? images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-surface-border bg-surface-soft">
                  <img src={imageUrl(img.file_path)} alt="" className="w-full h-full object-cover" />
                  {img.is_primary ? (
                    <span className="absolute top-1.5 left-1.5 bg-brand-700 text-white rounded-md p-1" title="Main image">
                      <Star size={11} fill="white" />
                    </span>
                  ) : (
                    <button type="button" onClick={() => handleSetPrimary(img.id)} title="Set as main image"
                      className="absolute top-1.5 left-1.5 bg-surface/90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={11} />
                    </button>
                  )}
                  <button type="button" onClick={() => handleDeleteImage(img.id)} title="Remove image"
                    className="absolute top-1.5 right-1.5 bg-surface/90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity text-accent-red">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
              : newImages.map((image, index) => (
                <div key={`${image.file.name}-${image.file.lastModified}-${index}`}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-surface-border bg-surface-soft">
                  <img src={image.previewUrl} alt={image.file.name} className="w-full h-full object-cover" />
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-brand-700 text-white rounded-md p-1" title="Main image">
                      <Star size={11} fill="white" />
                    </span>
                  )}
                  <button type="button" onClick={() => removeNewImage(index)} title={`Remove ${image.file.name}`}
                    className="absolute top-1.5 right-1.5 bg-surface/90 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity text-accent-red"
                    aria-label={`Remove ${image.file.name}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

            {canAddMore && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-xl border border-dashed border-surface-border flex flex-col items-center justify-center gap-1 text-ink-700/40 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50">
                <Upload size={18} />
                <span className="text-[10px] font-medium">{uploading ? 'Uploading…' : 'Add'}</span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={isEdit ? handleImageUpload : handleNewImageSelection}
          />
          <p className="text-xs text-ink-700/50">
            {isEdit
              ? 'Click the star to set the main image shown in listings and PDFs. Up to 8 images, 8 MB each.'
              : 'Up to 8 images, 8 MB each. The first image will be the main image shown in listings and PDFs.'}
          </p>
        </Card>

        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
          <Button type="submit" disabled={saving || uploading}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </form>
    </div>
  );
}
