import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ShoppingCart, PawPrint, Search, Menu, X, Plus, Trash2, Package, Settings, Star, Heart, ChevronRight, Minus, Lock, User, Scissors, AlertCircle, ShieldAlert, MapPin, Phone, Mail, Clock, Calendar, CreditCard, Smartphone, Landmark, CheckCircle, ArrowLeft } from 'lucide-react';

// --- Importações do Firebase (CDN) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// =================================================================================
// CONFIGURAÇÃO DO FIREBASE
// =================================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBt84Jr0CGuz1MUQN1BGdJg420t82WoySE",
  authDomain: "petvibe-9f361.firebaseapp.com",
  projectId: "petvibe-9f361",
  storageBucket: "petvibe-9f361.firebasestorage.app",
  messagingSenderId: "578275371080",
  appId: "1:578275371080:web:8a10239949e51672c9d07d"
};

// =================================================================================

// Inicialização do Firebase
let app, auth, db;
let isConfigured = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
} catch (error) {
    console.error("Erro na configuração do Firebase:", error);
}

// Dados de Fallback
const SAMPLE_ITEMS = [
    { id: '1', name: "Ração Premium Salmão", price: 149.90, category: "Alimentação", image: "https://images.unsplash.com/photo-1589924691195-41432c84c161?auto=format&fit=crop&w=500&q=80", type: "dog", kind: 'product', rating: 4.8 },
    { id: '2', name: "Banho e Tosa Completo", price: 65.00, category: "Estética", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=500&q=80", type: "dog", kind: 'service', rating: 5.0 },
    { id: '3', name: "Cama Nuvem Soft", price: 89.90, category: "Conforto", image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=500&q=80", type: "cat", kind: 'product', rating: 5.0 },
    { id: '4', name: "Consulta Veterinária", price: 150.00, category: "Saúde", image: "https://images.unsplash.com/photo-1628009368231-760335546e9c?auto=format&fit=crop&w=500&q=80", type: "cat", kind: 'service', rating: 4.9 },
    { id: '5', name: "Brinquedo Mordedor", price: 39.90, category: "Brinquedos", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=500&q=80", type: "dog", kind: 'product', rating: 4.7 },
    { id: '6', name: "Hotelzinho (Diária)", price: 100.00, category: "Hospedagem", image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=500&q=80", type: "dog", kind: 'service', rating: 4.8 },
];

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    
    // Estados do Checkout
    const [checkoutStep, setCheckoutStep] = useState('cart'); // cart, details, payment, success
    const [shippingDetails, setShippingDetails] = useState({ name: '', address: '', city: '', phone: '' });
    const [paymentMethod, setPaymentMethod] = useState('mbway'); // mbway, credit, mult
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Auth Admin State
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Alimentação', image: '', type: 'dog', kind: 'product' });
    const [isSeeding, setIsSeeding] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 1. Auth & Init
    useEffect(() => {
        if (!isConfigured) return;
        const initAuth = async () => {
            try { await signInAnonymously(auth); } catch (error) { console.error("Erro login:", error); }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    // 2. Data Fetching
    useEffect(() => {
        if (!isConfigured || !user) return;
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(data);
            setLoading(false);
            setPermissionError(false);
        }, (error) => {
            console.error("Erro busca:", error);
            if (error.code === 'permission-denied' || error.message.includes('permission')) {
                setPermissionError(true);
                setItems(SAMPLE_ITEMS);
            }
            setLoading(false); 
        });
        return () => unsubscribe();
    }, [user]);

    // --- Lógica ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (loginEmail === 'admin@petvibe.com' && loginPass === 'admin123') {
            setIsAdminAuthenticated(true);
            setView('admin');
            setIsMobileMenuOpen(false);
            setLoginEmail(''); setLoginPass('');
        } else {
            alert('Credenciais: admin@petvibe.com / admin123');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price) return;
        
        if (permissionError || !isConfigured) {
            alert("Modo Demo: Item adicionado localmente.");
            setItems([{...newItem, id: Date.now().toString(), price: parseFloat(newItem.price)}, ...items]);
            setNewItem({ name: '', price: '', category: 'Alimentação', image: '', type: 'dog', kind: 'product' });
            return;
        }

        try {
            await addDoc(collection(db, 'products'), {
                ...newItem,
                price: parseFloat(newItem.price),
                createdAt: serverTimestamp(),
                rating: (4 + Math.random()).toFixed(1)
            });
            setNewItem({ name: '', price: '', category: 'Alimentação', image: '', type: 'dog', kind: 'product' });
            alert('Cadastrado com sucesso!');
        } catch (error) {
            alert("Erro: " + error.message);
        }
    };

    const handleDeleteItem = async (id) => {
        if (confirm('Excluir item?')) {
            if (permissionError || !isConfigured) {
                 setItems(items.filter(i => i.id !== id));
                 return;
            }
            try { await deleteDoc(doc(db, 'products', id)); } catch (error) { alert("Erro: " + error.message); }
        }
    };

    const seedDatabase = async () => {
        if (permissionError || !isConfigured) {
            setItems(SAMPLE_ITEMS);
            alert("Dados locais recarregados.");
            return;
        }
        setIsSeeding(true);
        try {
            for (const item of SAMPLE_ITEMS) {
                const { id, ...data } = item;
                await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
            }
            alert('Banco populado!');
        } catch(e) { alert("Erro ao popular."); }
        setIsSeeding(false);
    };

    const addToCart = (item) => {
        setCart([...cart, item]);
        setIsCartOpen(true);
        setCheckoutStep('cart'); // Reset step on new add
    };
    const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
    const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

    // --- Lógica de Pagamento ---
    const processPayment = async () => {
        if (!shippingDetails.name || !shippingDetails.address || !shippingDetails.phone) {
            alert("Por favor, preencha todos os dados de envio.");
            return;
        }

        setIsProcessing(true);

        // Simula delay de rede
        setTimeout(async () => {
            const orderData = {
                items: cart,
                total: cartTotal,
                customer: shippingDetails,
                method: paymentMethod,
                status: 'paid',
                createdAt: serverTimestamp()
            };

            if (isConfigured && !permissionError) {
                try {
                    await addDoc(collection(db, 'orders'), orderData);
                } catch (e) {
                    console.error("Erro ao salvar pedido:", e);
                }
            }

            setIsProcessing(false);
            setCheckoutStep('success');
            setCart([]);
        }, 2000);
    };

    // --- Componentes Auxiliares ---
    const ItemCard = ({ item, isAdmin }) => (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100 flex flex-col relative h-full animate-fade-in">
            <div className="relative h-56 bg-gray-100 overflow-hidden">
                <img 
                    src={item.image || "https://placehold.co/400x300?text=Sem+Imagem"} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out"
                    onError={(e) => e.target.src = 'https://placehold.co/400x300?text=PetVibe'}
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                   <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-900 shadow-sm tracking-wide uppercase">{item.category}</span>
                   {item.kind === 'service' && <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 w-fit"><Scissors size={10} /> Serviço</span>}
                </div>
                {isAdmin && (
                    <button onClick={() => handleDeleteItem(item.id)} className="absolute top-3 right-3 bg-white/80 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white shadow-md transition z-10"><Trash2 size={16} /></button>
                )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.kind === 'service' ? 'Agendamento' : (item.type === 'dog' ? 'Cães' : 'Gatos')}</div>
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold"><Star size={12} fill="currentColor" /><span className="text-gray-400">{item.rating || '4.5'}</span></div>
                </div>
                <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2 flex-1">{item.name}</h3>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium">Preço</span>
                        <span className="text-xl font-bold text-blue-900">€ {item.price.toFixed(2)}</span>
                    </div>
                    {!isAdmin && (
                        <button 
                            onClick={() => addToCart(item)} 
                            className={`p-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center ${item.kind === 'service' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'}`}
                        >
                            {item.kind === 'service' ? <Calendar size={20} /> : <Plus size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // --- Telas ---
    const HomeScreen = () => (
        <div className="animate-fade-in">
            <header className="relative bg-[#102A43] text-white rounded-3xl overflow-hidden mb-16 shadow-2xl mx-4 lg:mx-0 min-h-[400px] flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F2035] via-[#102A43] to-transparent z-10 opacity-95"></div>
                <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Hero" />
                <div className="relative z-20 px-6 py-12 md:px-16 max-w-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Novo</span>
                        <span className="text-orange-200 text-sm font-medium">Coleção de Verão</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Tudo o que o seu <br/> pet precisa <span className="text-orange-500">para ser feliz.</span></h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg font-light">Encontre ração premium, brinquedos interativos e serviços de spa exclusivos. Entrega rápida para todo o país.</p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => setView('products')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-orange-500/30 flex items-center gap-2">
                            Ver Produtos <ChevronRight size={16}/>
                        </button>
                        <button onClick={() => setView('services')} className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-8 py-3 rounded-full font-bold transition">
                            Agendar Serviço
                        </button>
                    </div>
                </div>
            </header>

            <section className="px-4 lg:px-0 mb-20">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-blue-900">Destaques</h2>
                        <p className="text-gray-500 mt-2 font-light">Os favoritos da semana escolhidos pelos nossos clientes.</p>
                    </div>
                    <button onClick={() => setView('products')} className="text-orange-500 font-medium hover:underline hidden md:block">Ver catálogo completo</button>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.slice(0, 4).map(item => <ItemCard key={item.id} item={item} />)}
                    </div>
                )}
            </section>
        </div>
    );

    // (Outras telas simplificadas para focar no checkout...)
    const ProductsScreen = () => (
        <div className="px-4 lg:px-0 animate-fade-in">
            <h2 className="text-3xl font-bold text-blue-900 mb-8">Nossos Produtos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.filter(i => i.kind === 'product').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
        </div>
    );

    const ServicesScreen = () => (
        <div className="px-4 lg:px-0 animate-fade-in">
            <h2 className="text-3xl font-bold text-blue-900 mb-8">Serviços & Spa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.filter(i => i.kind === 'service').map(item => <ItemCard key={item.id} item={item} />)}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
            
            {permissionError && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-800 text-xs font-medium">
                    <ShieldAlert size={14} />
                    <span>Modo Demo: Banco de dados restrito.</span>
                </div>
            )}

            {/* Navegação */}
            <nav className="glass-nav sticky top-0 z-40 border-b border-gray-100/50">
                <div className="max-w-7xl mx-auto px-4 lg:px-0 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
                        <div className="bg-orange-500 text-white p-2 rounded-xl group-hover:rotate-12 transition duration-300">
                            <PawPrint size={24} />
                        </div>
                        <span className="text-2xl font-bold text-blue-900 tracking-tight">PetVibe</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                        {['home', 'products', 'services'].map(v => (
                            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${view === v ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-orange-500'}`}>{v === 'home' ? 'Início' : v === 'products' ? 'Produtos' : 'Serviços'}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }} className="relative p-2 hover:bg-gray-100 rounded-full transition group">
                            <ShoppingCart className="text-gray-600 group-hover:text-orange-500 transition" size={24} />
                            {cart.length > 0 && <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                        </button>
                        <button onClick={() => isAdminAuthenticated ? setView('admin') : setView('login')} className="hidden md:flex items-center gap-2 text-sm font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full transition">
                            {isAdminAuthenticated ? <Settings size={16}/> : <User size={16}/>} {isAdminAuthenticated ? 'Painel' : 'Entrar'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Conteúdo Principal */}
            <main className="flex-1 max-w-7xl mx-auto w-full pt-8 pb-20">
                {view === 'home' && <HomeScreen />}
                {view === 'products' && <ProductsScreen />}
                {view === 'services' && <ServicesScreen />}
                
                {view === 'login' && (
                    <div className="flex items-center justify-center py-20 animate-fade-in px-4">
                        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 text-center">
                            <h2 className="text-2xl font-bold text-blue-900 mb-2">Acesso Administrativo</h2>
                            <form onSubmit={handleLogin} className="space-y-4 text-left mt-6">
                                <input type="email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="admin@petvibe.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                                <input type="password" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="admin123" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                                <button className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg mt-4">Aceder ao Painel</button>
                            </form>
                        </div>
                    </div>
                )}

                {view === 'admin' && (
                    <div className="animate-fade-in px-4 lg:px-0">
                        <div className="flex items-center justify-between mb-8 bg-blue-900 text-white p-6 rounded-3xl shadow-lg">
                            <h2 className="text-2xl font-bold">Gestão da Loja</h2>
                            <button onClick={() => { setIsAdminAuthenticated(false); setView('home'); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold text-sm backdrop-blur transition">Sair</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                                <h3 className="text-xl font-bold mb-6 text-blue-900">Cadastrar Novo Item</h3>
                                <form onSubmit={handleAddItem} className="space-y-5">
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 rounded-xl border-2 text-center font-bold cursor-pointer ${newItem.kind === 'product' ? 'border-orange-500 text-orange-600' : 'border-gray-100 text-gray-400'}`}><input type="radio" name="kind" value="product" checked={newItem.kind === 'product'} onChange={() => setNewItem({...newItem, kind: 'product'})} className="hidden" />Produto</label>
                                        <label className={`flex-1 p-3 rounded-xl border-2 text-center font-bold cursor-pointer ${newItem.kind === 'service' ? 'border-purple-500 text-purple-600' : 'border-gray-100 text-gray-400'}`}><input type="radio" name="kind" value="service" checked={newItem.kind === 'service'} onChange={() => setNewItem({...newItem, kind: 'service'})} className="hidden" />Serviço</label>
                                    </div>
                                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nome do Item" />
                                    <div className="flex gap-4">
                                        <input type="number" step="0.01" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="Preço (€)" />
                                        <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                            <option>Alimentação</option><option>Brinquedos</option><option>Conforto</option><option>Saúde</option><option>Estética</option>
                                        </select>
                                    </div>
                                    <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="URL da Imagem" />
                                    <button className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg">Cadastrar</button>
                                </form>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[600px] flex flex-col overflow-y-auto custom-scrollbar space-y-3">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-xl transition">
                                        <img src={item.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                        <div className="flex-1 min-w-0"><div className="font-bold text-gray-800 truncate text-sm">{item.name}</div><div className="text-xs text-gray-400">€ {item.price.toFixed(2)}</div></div>
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-300 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal de Carrinho & Checkout */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-fade-in">
                        
                        {/* Cabeçalho do Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                {checkoutStep === 'cart' && <><ShoppingCart className="text-orange-500" size={20} /> Seu Carrinho</>}
                                {(checkoutStep === 'details' || checkoutStep === 'payment') && <><Lock className="text-orange-500" size={20} /> Checkout Seguro</>}
                                {checkoutStep === 'success' && <><CheckCircle className="text-green-500" size={20} /> Sucesso!</>}
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
                        </div>

                        {/* Corpo do Modal (Muda conforme a etapa) */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            
                            {/* 1. Vista do Carrinho */}
                            {checkoutStep === 'cart' && (
                                <>
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                            <ShoppingCart size={48} className="mb-4 opacity-20" />
                                            <p>O carrinho está vazio.</p>
                                            <button onClick={() => { setIsCartOpen(false); setView('products'); }} className="mt-4 text-orange-500 font-bold text-sm hover:underline">Ir às compras</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {cart.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-white" />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                                                        <span className="text-blue-900 font-bold text-sm">€ {item.price.toFixed(2)}</span>
                                                    </div>
                                                    <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-white rounded-lg"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* 2. Vista de Dados de Envio */}
                            {checkoutStep === 'details' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Dados de Envio</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Nome Completo</label>
                                        <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-500 transition" placeholder="Ex: João Silva" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Morada</label>
                                        <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-500 transition" placeholder="Rua das Flores, nº 123" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Cidade</label>
                                            <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-500 transition" placeholder="Lisboa" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Telemóvel</label>
                                            <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-orange-500 transition" placeholder="912 345 678" value={shippingDetails.phone} onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Vista de Pagamento */}
                            {checkoutStep === 'payment' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase">Método de Pagamento</h3>
                                    
                                    {/* Seleção MB Way */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'mbway' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'mbway'} onChange={() => setPaymentMethod('mbway')} />
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-red-500"><Smartphone size={24} /></div>
                                        <div className="flex-1"><div className="font-bold text-gray-800">MB WAY</div><div className="text-xs text-gray-500">Pagar via telemóvel</div></div>
                                        {paymentMethod === 'mbway' && <div className="w-4 h-4 bg-orange-500 rounded-full"></div>}
                                    </label>

                                    {/* Seleção Multibanco */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'mult' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'mult'} onChange={() => setPaymentMethod('mult')} />
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-600"><Landmark size={24} /></div>
                                        <div className="flex-1"><div className="font-bold text-gray-800">Multibanco</div><div className="text-xs text-gray-500">Entidade e Referência</div></div>
                                        {paymentMethod === 'mult' && <div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
                                    </label>

                                    {/* Seleção Cartão */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'credit' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-purple-600"><CreditCard size={24} /></div>
                                        <div className="flex-1"><div className="font-bold text-gray-800">Cartão de Crédito</div><div className="text-xs text-gray-500">Visa / Mastercard</div></div>
                                        {paymentMethod === 'credit' && <div className="w-4 h-4 bg-purple-500 rounded-full"></div>}
                                    </label>

                                    {/* Inputs Específicos */}
                                    {paymentMethod === 'mbway' && (
                                        <div className="bg-orange-50 p-4 rounded-xl animate-fade-in">
                                            <label className="block text-xs font-bold text-orange-800 mb-1">Número MB WAY</label>
                                            <input className="w-full p-3 bg-white rounded-lg border border-orange-200 outline-none" placeholder="912 345 678" defaultValue={shippingDetails.phone} />
                                        </div>
                                    )}
                                    {paymentMethod === 'credit' && (
                                        <div className="bg-purple-50 p-4 rounded-xl space-y-3 animate-fade-in">
                                            <input className="w-full p-3 bg-white rounded-lg border border-purple-200 outline-none" placeholder="Número do Cartão" />
                                            <div className="flex gap-3">
                                                <input className="w-full p-3 bg-white rounded-lg border border-purple-200 outline-none" placeholder="MM/AA" />
                                                <input className="w-full p-3 bg-white rounded-lg border border-purple-200 outline-none" placeholder="CVC" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. Sucesso */}
                            {checkoutStep === 'success' && (
                                <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6"><CheckCircle size={40} /></div>
                                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Obrigado!</h3>
                                    <p className="text-gray-500 mb-8">A sua encomenda foi registada com sucesso. Receberá um email com os detalhes em breve.</p>
                                    <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition">Continuar a Comprar</button>
                                </div>
                            )}
                        </div>

                        {/* Rodapé do Modal (Botões de Ação) */}
                        {checkoutStep !== 'success' && (
                            <div className="p-6 border-t border-gray-50 bg-white">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-500 font-medium">Total a Pagar</span>
                                    <span className="text-3xl font-bold text-blue-900">€ {cartTotal.toFixed(2)}</span>
                                </div>
                                
                                {checkoutStep === 'cart' && (
                                    <button onClick={() => setCheckoutStep('details')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition disabled:opacity-50" disabled={cart.length === 0}>
                                        Checkout
                                    </button>
                                )}

                                {checkoutStep === 'details' && (
                                    <div className="flex gap-3">
                                        <button onClick={() => setCheckoutStep('cart')} className="px-4 py-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"><ArrowLeft size={20}/></button>
                                        <button onClick={() => setCheckoutStep('payment')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition">
                                            Continuar para Pagamento
                                        </button>
                                    </div>
                                )}

                                {checkoutStep === 'payment' && (
                                    <div className="flex gap-3">
                                        <button onClick={() => setCheckoutStep('details')} className="px-4 py-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"><ArrowLeft size={20}/></button>
                                        <button onClick={processPayment} disabled={isProcessing} className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 transition flex justify-center items-center gap-2">
                                            {isProcessing ? 'A Processar...' : 'Confirmar e Pagar'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
