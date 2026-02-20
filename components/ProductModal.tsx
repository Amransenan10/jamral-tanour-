
import React, { useState } from 'react';
import { Product } from '../types';
import { supabase } from '../supabaseClient';
import { X, Upload, Plus, Trash2, Utensils, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductModalProps {
    product?: Product | null;
    onClose: () => void;
    onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price || 0);
    const [category, setCategory] = useState(product?.category || 'الرئيسية');
    const [calories, setCalories] = useState(product?.calories || 0);
    const [ingredients, setIngredients] = useState<string>(product?.ingredients?.join(', ') || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = product?.image_url || '';

            // Upload image if a new one is selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const productData = {
                name,
                description,
                price,
                category,
                calories,
                ingredients: ingredients.split(',').map(i => i.trim()),
                image_url: imageUrl
            };

            if (product?.id) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', product.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (err: any) {
            console.error("Save Error:", err);
            alert(`خطأ في الحفظ: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-['Cairo']" dir="rtl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-[#121212] border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-orange-600 to-zinc-900"></div>

                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600/20 rounded-2xl flex items-center justify-center">
                                <Utensils className="w-6 h-6 text-orange-500" />
                            </div>
                            {product ? 'تعديل صنف' : 'إضافة صنف جديد'}
                        </h2>
                        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Image Upload */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">صورة الصنف</label>
                                <div
                                    className="relative h-64 bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center group hover:border-orange-500/50 transition-all cursor-pointer"
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600 group-hover:text-orange-500 transition-colors">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <span className="text-zinc-600 text-xs font-bold">انقر لرفع صورة</span>
                                        </>
                                    )}
                                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />

                                    {imagePreview && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-black uppercase tracking-widest bg-orange-600 px-4 py-2 rounded-xl">تغيير الصورة</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Fields */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">اسم الصنف</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">السعر (ريال)</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(parseFloat(e.target.value))}
                                            required
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">السعرات</label>
                                        <input
                                            type="number"
                                            value={calories}
                                            onChange={(e) => setCalories(parseInt(e.target.value))}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">التصنيف</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold appearance-none"
                                    >
                                        <option value="الرئيسية">الرئيسية (رز ولحم/دجاج)</option>
                                        <option value="المقبلات">المقبلات</option>
                                        <option value="المشروبات">المشروبات</option>
                                        <option value="الحلويات">الحلويات</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">المكونات (افصل بينها بفاصلة)</label>
                                <textarea
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="مثال: دجاج، أرز، بهارات، مكسرات"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold h-20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">الوصف</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 focus:outline-none focus:border-orange-500 transition-all text-white font-bold h-24"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-black py-5 rounded-3xl shadow-2xl shadow-orange-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span>حفظ البيانات</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ProductModal;
