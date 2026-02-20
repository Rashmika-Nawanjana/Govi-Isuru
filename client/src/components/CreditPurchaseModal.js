import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, Package } from 'lucide-react';

const CreditPurchaseModal = ({ isOpen, onClose, onPurchaseSuccess, lang = 'en' }) => {
    const [loading, setLoading] = useState(false);
    const [selectedPack, setSelectedPack] = useState(null);

    if (!isOpen) return null;

    const t = {
        en: {
            title: "Top Up Credits",
            subtitle: "Get more credits to use AI features and Marketplace",
            buy: "Buy Now",
            processing: "Processing...",
            success: "Purchase Successful!",
            packs: [
                { id: 'pack_100', credits: 100, price: 'Rs. 500', amount: 100 },
                { id: 'pack_500', credits: 500, price: 'Rs. 2000', amount: 500, popular: true },
                { id: 'pack_1000', credits: 1000, price: 'Rs. 3500', amount: 1000 }
            ]
        },
        si: {
            title: "ණය (Credits) ලබා ගන්න",
            subtitle: "AI විශේෂාංග සහ වෙළඳපොළ භාවිතය සඳහා තවත් ණය ලබා ගන්න",
            buy: "මිලදී ගන්න",
            processing: "සැකසෙමින් පවතී...",
            success: "මිලදී ගැනීම සාර්ථකයි!",
            packs: [
                { id: 'pack_100', credits: 100, price: 'රු. 500', amount: 100 },
                { id: 'pack_500', credits: 500, price: 'රු. 2000', amount: 500, popular: true },
                { id: 'pack_1000', credits: 1000, price: 'රු. 3500', amount: 1000 }
            ]
        }
    };

    const text = t[lang] || t.en;

    const handlePurchase = async (pack) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            const res = await fetch(`${API_URL}/api/credits/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: pack.amount, packId: pack.id })
            });

            const data = await res.json();

            if (res.ok) {
                alert(text.success);
                if (onPurchaseSuccess) onPurchaseSuccess(data.newBalance);
                onClose();
            } else {
                alert(data.error || 'Purchase failed');
            }
        } catch (err) {
            console.error(err);
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <CreditCard className="text-white" size={24} />
                        </div>
                        <h2 className="text-xl font-bold">{text.title}</h2>
                    </div>
                    <p className="text-green-100 text-sm">{text.subtitle}</p>
                </div>

                {/* Packs */}
                <div className="p-6 space-y-4">
                    {text.packs.map((pack) => (
                        <div
                            key={pack.id}
                            onClick={() => setSelectedPack(pack.id)}
                            className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between ${selectedPack === pack.id
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-800'
                                    : 'border-slate-100 dark:border-gray-700 hover:border-green-200 hover:bg-slate-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {pack.popular && (
                                <span className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    POPULAR
                                </span>
                            )}

                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${selectedPack === pack.id ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-400'}`}>
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">{pack.credits} Credits</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{pack.price}</p>
                                </div>
                            </div>

                            {selectedPack === pack.id && (
                                <div className="text-green-500">
                                    <CheckCircle size={24} fill="currentColor" className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
                    <button
                        disabled={!selectedPack || loading}
                        onClick={() => handlePurchase(text.packs.find(p => p.id === selectedPack))}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/25 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {text.processing}
                            </>
                        ) : (
                            <>
                                <CreditCard size={18} />
                                {text.buy}
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-3">
                        Secure Sandbox Payment (Mock)
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CreditPurchaseModal;
