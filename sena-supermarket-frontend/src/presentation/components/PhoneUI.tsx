import React, { useState, useEffect } from 'react';
import { usePhoneStore } from '../../application/store/usePhoneStore';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { recoverHealth } from '../../infrastructure/api/progressApi';
import { useGameTime } from '../hooks/useGameTime';
import { MODELOS_3D } from '../../application/data/modelosUrls';

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
}

type TabType = 'muebles' | 'estado' | 'productos' | 'inventario' | 'chats' | 'banco';

interface ProductCatalog {
  id: string;
  name: string;
  unitPrice: number;
  boxUnits: number;
  icon: string;
}

interface FurnitureCatalog {
  id: string;
  name: string;
  model: string;
  buyPrice: number;
  sellPrice: number;
  icon: string;
  canChangeColor: boolean;
}

interface OwnedFurniture {
  uid: string;
  catalogId: string;
  color?: string;
}

interface ChatOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
  reward: number;
}

interface ChatMessage {
  id: string;
  npcName: string;
  avatar: string;
  message: string;
  options: ChatOption[];
  answered?: boolean;
  statusText?: string;
  isPositive?: boolean;
}

interface BankLoanOffer {
  id: string;
  bankName: string;
  minLevel: number;
  loanAmount: number;
  dailyInstallment: number;
  penaltyFee: number;
  icon: string;
}

const chatPool: ChatMessage[] = [
  {
    id: 'chat_leche',
    npcName: 'Doña Martha',
    avatar: '👵',
    message: '¡Hola! Compré una leche ayer y vino defectuosa. ¿Me la pueden cambiar?',
    options: [
      { text: 'Claro que sí, tráela con el recibo y te la cambiamos de inmediato.', isCorrect: true, feedback: '¡Excelente atención! Doña Martha te dejó $5.000 de propina.', reward: 5000 },
      { text: 'Eso ya no es mi problema, debió revisar antes de llevarla.', isCorrect: false, feedback: 'Pésimo servicio. El cliente se quejó (-$3.000).', reward: -3000 },
    ],
  },
  {
    id: 'chat_horario',
    npcName: 'Carlos (Vecino)',
    avatar: '🧔',
    message: 'Buenas tardes, ¿a qué hora cierran hoy el supermercado?',
    options: [
      { text: 'Atendemos hasta las 9:00 PM. ¡Te esperamos!', isCorrect: true, feedback: 'Respuesta rápida y amable (+$2.000).', reward: 2000 },
      { text: 'No sé, mire en la puerta si está abierto.', isCorrect: false, feedback: 'Atención fría. El cliente no vendrá (-$1.000).', reward: -1000 },
    ],
  },
  {
    id: 'chat_precios',
    npcName: 'Sofía',
    avatar: '👩',
    message: 'Hola, ¿tienen descuento si compro varias cubetas de huevos?',
    options: [
      { text: 'Llevando 3 o más cubetas te hacemos un 10% de descuento.', isCorrect: true, feedback: '¡Gran venta! Ganaste $8.000 extra.', reward: 8000 },
      { text: 'No, los precios son fijos para todo el mundo.', isCorrect: false, feedback: 'El cliente decidió comprar en otro lugar.', reward: 0 },
    ],
  },
  {
    id: 'chat_derrame',
    npcName: 'Roberto',
    avatar: '👨',
    message: 'Hola, noté un derrame de líquido en el pasillo principal.',
    options: [
      { text: 'Muchas gracias por avisar, ya mismo enviamos a limpiarlo.', isCorrect: true, feedback: 'Evitaste un accidente (+$4.000).', reward: 4000 },
      { text: 'Ahí hay traperos, si quiere límpielo usted.', isCorrect: false, feedback: 'Queja formal registrada (-$5.000).', reward: -5000 },
    ],
  },
];

const catalogFurniture: FurnitureCatalog[] = [
  { id: 'mueble_caja', name: 'Caja Registradora', model: MODELOS_3D.mesaCajaRegistradora, buyPrice: 50000, sellPrice: 40000, icon: '🖥️', canChangeColor: true },
  { id: 'mueble_estante', name: 'Estante Individual', model: MODELOS_3D.estanteIndividual, buyPrice: 25000, sellPrice: 20000, icon: '🗄️', canChangeColor: true },
];

const catalogProducts: ProductCatalog[] = [
  { id: 'prod_leche', name: 'Leche Entera 1L', unitPrice: 3800, boxUnits: 6, icon: '🥛' },
  { id: 'prod_pan', name: 'Pan Tajado Familiar', unitPrice: 4500, boxUnits: 8, icon: '🍞' },
  { id: 'prod_arroz', name: 'Arroz Diana 1 kg', unitPrice: 4200, boxUnits: 12, icon: '🌾' },
  { id: 'prod_aceite', name: 'Aceite Vegetal 900ml', unitPrice: 9800, boxUnits: 6, icon: '🍾' },
  { id: 'prod_huevos', name: 'Cubeta Huevos x30', unitPrice: 16000, boxUnits: 4, icon: '🥚' },
];

const bankOffers: BankLoanOffer[] = [
  { id: 'bank_1', bankName: 'Banco Nacional (Nivel 1)', minLevel: 1, loanAmount: 500000, dailyInstallment: 40000, penaltyFee: 70000, icon: '🏦' },
  { id: 'bank_2', bankName: 'CrediFácil (Nivel 2)', minLevel: 2, loanAmount: 1200000, dailyInstallment: 95000, penaltyFee: 150000, icon: '💳' },
  { id: 'bank_3', bankName: 'MegaBanco VIP (Nivel 3+)', minLevel: 3, loanAmount: 3000000, dailyInstallment: 240000, penaltyFee: 350000, icon: '💎' },
];

export const PhoneUI: React.FC = () => {
  const { isOpen, close } = usePhoneStore();
  const store = useSimulationStore() as any;

  const money = store.money !== undefined ? store.money : 50000;
  const totalSalesCount = store.totalSalesCount ?? 0;
  
  const playerState = store.playerState || { level: 1, health: 100, hunger: 100 };
  const inventory = (store.inventory || {}) as Record<string, number>;
  const addDeliveryBox = store.addDeliveryBox;

  const furnitureInventory: OwnedFurniture[] = store.furnitureInventory || [];
  const setFurnitureInventory = (inv: any) => useSimulationStore.setState({ furnitureInventory: inv } as any);

  const activeLoan = store.activeLoan || null;
  const setActiveLoan = (loan: any) => useSimulationStore.setState({ activeLoan: loan } as any);

  const { hours, minutes } = useGameTime();

  const [activeTab, setActiveTab] = useState<TabType>('productos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [salePrices, setSalePrices] = useState<Record<string, number>>({});
  const [activeChats, setActiveChats] = useState<ChatMessage[]>([]);
  const [lastTrackedHour, setLastTrackedHour] = useState<number>(hours);
  const [lastProcessedDay, setLastProcessedDay] = useState<number>(-1);
  const [liveTime, setLiveTime] = useState('');

  const updateMoney = (newAmount: number) => {
    useSimulationStore.setState({ money: Math.max(0, newAmount) } as any);
  };

  const loadNewRandomChats = () => {
    const shuffled = [...chatPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((chat) => ({
      ...chat,
      id: `${chat.id}_${Date.now()}_${Math.random()}`,
      answered: false,
    }));
    setActiveChats(selected);
  };

  useEffect(() => {
    if (activeChats.length === 0) loadNewRandomChats();
  }, []);

  useEffect(() => {
    if (hours < lastTrackedHour && hours < 3) loadNewRandomChats();
    setLastTrackedHour(hours);
  }, [hours]);

  useEffect(() => {
    const currentDay = Math.floor(hours / 24);
    if (activeLoan && currentDay !== lastProcessedDay && lastProcessedDay !== -1) {
      setLastProcessedDay(currentDay);
      if (money >= activeLoan.dailyInstallment) {
        updateMoney(money - activeLoan.dailyInstallment);
        const newRemainingDebt = activeLoan.remainingDebt - activeLoan.dailyInstallment;
        if (newRemainingDebt <= 0) {
          setActiveLoan(null);
          triggerNotification(`🎉 ¡Has pagado la totalidad de tu préstamo bancario!`);
        } else {
          setActiveLoan({ ...activeLoan, remainingDebt: newRemainingDebt });
          triggerNotification(`🏦 Cuota de banco descontada: -$${activeLoan.dailyInstallment.toLocaleString()}`);
        }
      } else {
        const currentLevel = playerState.level ?? 1;
        const newLevel = Math.max(1, currentLevel - 1);
        const penaltyTotal = activeLoan.penaltyFee;
        
        updateMoney(money - penaltyTotal);
        useSimulationStore.setState({
          playerState: { ...playerState, level: newLevel }
        } as any);
        triggerNotification(`⚠️ ¡MOROSIDAD! No tenías para la cuota. Perdiste 1 Nivel y multa de -$${penaltyTotal.toLocaleString()}`);
      }
    } else if (lastProcessedDay === -1) {
      setLastProcessedDay(currentDay);
    }
  }, [hours, activeLoan, money]);

  useEffect(() => {
    const updateClock = () => {
      const h = Math.floor(hours) % 24;
      const m = Math.floor((hours % 1) * 60) || Math.floor(minutes % 60);
      setLiveTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 250);
    return () => clearInterval(timer);
  }, [hours, minutes]);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [isOpen]);

  const updateCart = (prodId: string, delta: number) => {
    setCart((prev) => {
      const newQty = Math.max(0, (prev[prodId] || 0) + delta);
      const updated = { ...prev };
      if (newQty > 0) updated[prodId] = newQty;
      else delete updated[prodId];
      return updated;
    });
  };

  const totalCartCost = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = catalogProducts.find((p) => p.id === id);
    return total + (product ? product.unitPrice * qty : 0);
  }, 0);

  const handleCheckout = () => {
    if (totalCartCost === 0) return;
    if (money < totalCartCost) {
      alert(`Fondos insuficientes. Necesitas $${totalCartCost.toLocaleString()} COP`);
      return;
    }

    const newMoney = money - totalCartCost;

    const updatedInventory = { ...inventory };
    Object.entries(cart).forEach(([prodId, qty]) => {
      updatedInventory[prodId] = (updatedInventory[prodId] || 0) + qty;
    });

    const allItems: DeliveryItem[] = [];
    Object.entries(cart).forEach(([prodId, qty]) => {
      const prod = catalogProducts.find((p) => p.id === prodId);
      allItems.push({ productId: prodId, productName: prod?.name || prodId, quantity: qty });
    });

    const MAX_ITEMS_PER_BOX = 12;
    const boxesToCreate: DeliveryItem[][] = [];
    let currentBoxItems: DeliveryItem[] = [];
    let currentBoxCount = 0;

    allItems.forEach((item) => {
      let remainingQty = item.quantity;
      while (remainingQty > 0) {
        const spaceLeft = MAX_ITEMS_PER_BOX - currentBoxCount;
        const qtyToAdd = Math.min(remainingQty, spaceLeft);
        currentBoxItems.push({ ...item, quantity: qtyToAdd });
        currentBoxCount += qtyToAdd;
        remainingQty -= qtyToAdd;
        if (currentBoxCount >= MAX_ITEMS_PER_BOX) {
          boxesToCreate.push(currentBoxItems);
          currentBoxItems = [];
          currentBoxCount = 0;
        }
      }
    });

    if (currentBoxItems.length > 0) boxesToCreate.push(currentBoxItems);

    const currentBoxes = store.deliveryBoxes || [];
    const totalSpawned = store.totalSpawnedBoxes ?? currentBoxes.length;

    boxesToCreate.forEach((boxItems, idx) => {
      const globalIdx = totalSpawned + idx;
      const maxPerRow = 3;
      const row = Math.floor(globalIdx / maxPerRow) % 2;
      const stackLevel = Math.floor(globalIdx / 6);
      const col = globalIdx % maxPerRow;

      // Posición del andén, fuera de la carretera
      const posX = -7.4 + (col * 0.55);
      const posY = 0.081 + (stackLevel * 0.32);
      const posZ = 0.8 + (row * 0.55);

      const newBox = {
        id: `box_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        items: boxItems,
        position: [posX, posY, posZ] as [number, number, number],
        deliveryTimeGameHours: hours,
      };

      if (typeof addDeliveryBox === 'function') {
        try {
          addDeliveryBox(boxItems, [posX, posY, posZ]);
        } catch {
          addDeliveryBox(newBox);
        }
      } else {
        const existingBoxes = useSimulationStore.getState().deliveryBoxes || [];
        useSimulationStore.setState({
          deliveryBoxes: [...existingBoxes, newBox],
        } as any);
      }
    });

    useSimulationStore.setState({
      money: newMoney,
      inventory: updatedInventory,
      totalSpawnedBoxes: totalSpawned + boxesToCreate.length,
    } as any);

    setCart({});
    triggerNotification(`📦 ¡Pedido realizado! Caja de entrega generada.`);
  };

  const handleAnswerChat = (chatId: string, optionIdx: number) => {
    setActiveChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const selected = chat.options[optionIdx];
        updateMoney(money + selected.reward);
        triggerNotification(selected.feedback);
        return { ...chat, answered: true, statusText: selected.feedback, isPositive: selected.isCorrect };
      })
    );
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRecoverHealth = async () => {
    try {
      setRecovering(true); setRecoveryError('');
      const updatedUser = await recoverHealth('1');
      const currentState = useSimulationStore.getState() as any;
      useSimulationStore.setState({
        playerState: { ...currentState.playerState, health: updatedUser.health ?? 100 }
      } as any);
    } catch (err: any) {
      setRecoveryError(err.message || 'Error al curarse');
    } finally {
      setRecovering(false);
    }
  };

  const handleRequestLoan = (offer: BankLoanOffer) => {
    const playerLevel = playerState?.level ?? 1;
    if (playerLevel < offer.minLevel) {
      alert(`Necesitas ser Nivel ${offer.minLevel} para pedir este préstamo.`);
      return;
    }
    if (activeLoan) {
      alert('Ya tienes un préstamo activo con un banco. Debes pagarlo primero.');
      return;
    }

    updateMoney(money + offer.loanAmount);
    setActiveLoan({
      bankName: offer.bankName,
      totalDebt: offer.loanAmount * 1.3,
      remainingDebt: offer.loanAmount * 1.3,
      dailyInstallment: offer.dailyInstallment,
      penaltyFee: offer.penaltyFee,
    });
    triggerNotification(`🏦 ¡Préstamo aprobado de $${offer.loanAmount.toLocaleString()} COP!`);
  };

  const handlePriceChange = (id: string, value: string, basePrice: number) => {
    const num = parseInt(value);
    const maxAllowed = basePrice + 3000;

    if (isNaN(num) || num <= 0) {
      setSalePrices((prev) => ({ ...prev, [id]: basePrice }));
      triggerNotification('⚠️ El precio no puede ser 0 o menor.');
      return;
    }

    if (num > maxAllowed) {
      setSalePrices((prev) => ({ ...prev, [id]: maxAllowed }));
      triggerNotification('⚠️ ¡Máximo $3.000 de ganancia! El cliente se enojaría.');
      return;
    }

    setSalePrices((prev) => ({ ...prev, [id]: num }));
  };

  const handleBuyFurniture = (item: FurnitureCatalog) => {
    if (money < item.buyPrice) {
      triggerNotification('⚠️ Fondos insuficientes para este mueble.');
      return;
    }
    updateMoney(money - item.buyPrice);

    const newFurniture: OwnedFurniture = {
      uid: `furn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      catalogId: item.id,
      color: item.canChangeColor ? '#ffffff' : undefined,
    };
    setFurnitureInventory([...furnitureInventory, newFurniture]);
    triggerNotification(`✅ Compraste: ${item.name}`);
  };

  const handleSellFurniture = (uid: string) => {
    const item = furnitureInventory.find((f) => f.uid === uid);
    if (!item) return;
    const catalogItem = catalogFurniture.find((c) => c.id === item.catalogId);
    if (!catalogItem) return;

    updateMoney(money + catalogItem.sellPrice);
    setFurnitureInventory(furnitureInventory.filter((f) => f.uid !== uid));
    const currentPlaced = (useSimulationStore.getState() as any).placedFurniture || [];
    useSimulationStore.setState({
      placedFurniture: currentPlaced.filter((f: any) => f.uid !== uid),
    } as any);
    triggerNotification(`💰 Vendido por $${catalogItem.sellPrice.toLocaleString()}`);
  };

  const handleSpawnFurniture = (item: OwnedFurniture) => {
    const catalogItem = catalogFurniture.find((c) => c.id === item.catalogId);
    if (!catalogItem) return;

    useSimulationStore.setState({
      holdingFurniture: { ...item, model: catalogItem.model },
    } as any);
    close();
    triggerNotification('📍 Haz clic para colocar el mueble al ras del piso.');
  };

  const handleUpdateFurnitureColor = (uid: string, newColor: string) => {
    setFurnitureInventory(
      furnitureInventory.map((f) => (f.uid === uid ? { ...f, color: newColor } : f))
    );
    const currentPlaced = (useSimulationStore.getState() as any).placedFurniture || [];
    useSimulationStore.setState({
      placedFurniture: currentPlaced.map((f: any) => (f.uid === uid ? { ...f, color: newColor } : f)),
    } as any);
  };

  if (!isOpen) return null;

  const currentHealth = Math.max(0, Math.min(100, playerState?.health ?? 100));
  const isDead = currentHealth <= 0;

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; } 
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 8px; }
      `}</style>

      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 20, right: 20, width: '310px', height: '500px',
          background: '#090d16', borderRadius: '20px', border: '3px solid #1e293b',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)', color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px',
          display: 'flex', flexDirection: 'column', boxSizing: 'border-box', zIndex: 10000,
          pointerEvents: 'auto', userSelect: 'none',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.98)',
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        }}
      >
        {notification && (
          <div style={{ background: '#0284c7', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '6px', marginBottom: '6px', textAlign: 'center', fontWeight: 'bold' }}>
            {notification}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
          <span>⭐ Nivel {playerState?.level ?? 1}</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🕒 {liveTime}</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>${money.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0', position: 'relative' }}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ☰ <span>Menú</span>
          </button>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {activeTab}
          </div>
        </div>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: '75px', left: '12px', width: '180px',
            background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '6px', gap: '4px'
          }}>
            <button onClick={() => { setActiveTab('estado'); setMenuOpen(false); }} style={{ background: activeTab === 'estado' ? '#38bdf8' : 'transparent', color: activeTab === 'estado' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>❤️ Salud</button>
            <button onClick={() => { setActiveTab('productos'); setMenuOpen(false); }} style={{ background: activeTab === 'productos' ? '#38bdf8' : 'transparent', color: activeTab === 'productos' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>📦 Productos</button>
            <button onClick={() => { setActiveTab('inventario'); setMenuOpen(false); }} style={{ background: activeTab === 'inventario' ? '#38bdf8' : 'transparent', color: activeTab === 'inventario' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>📋 Inventario</button>
            <button onClick={() => { setActiveTab('muebles'); setMenuOpen(false); }} style={{ background: activeTab === 'muebles' ? '#38bdf8' : 'transparent', color: activeTab === 'muebles' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>🪑 Muebles</button>
            <button onClick={() => { setActiveTab('chats'); setMenuOpen(false); }} style={{ background: activeTab === 'chats' ? '#22c55e' : 'transparent', color: activeTab === 'chats' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>💬 Chats</button>
            <button onClick={() => { setActiveTab('banco'); setMenuOpen(false); }} style={{ background: activeTab === 'banco' ? '#f59e0b' : 'transparent', color: activeTab === 'banco' ? '#000' : '#fff', border: 'none', padding: '8px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer' }}>🏦 Banco</button>
          </div>
        )}

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {activeTab === 'productos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {catalogProducts.map((p) => {
                const qty = cart[p.id] || 0;
                return (
                  <div key={p.id} style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '9.5px', fontWeight: 'bold' }}>{p.icon} {p.name}</div>
                      <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '1px' }}>
                        $ {p.unitPrice.toLocaleString()} /u {qty > 0 && <span style={{ color: '#4ade80' }}> | Sub: $ {(p.unitPrice * qty).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => updateCart(p.id, -1)} style={{ background: '#334155', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <span style={{ fontSize: '9.5px', fontWeight: 'bold', minWidth: '14px', textAlign: 'center' }}>{qty}</span>
                      <button onClick={() => updateCart(p.id, 1)} style={{ background: '#0284c7', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => updateCart(p.id, p.boxUnits)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '3px 5px', borderRadius: '4px', fontSize: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+Caja</button>
                    </div>
                  </div>
                );
              })}
              {totalCartCost > 0 && (
                <button onClick={handleCheckout} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)' }}>
                  Hacer Pedido ($ {totalCartCost.toLocaleString()})
                </button>
              )}
            </div>
          )}

          {activeTab === 'muebles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>INVENTARIO DE MUEBLES</div>
              {furnitureInventory.length === 0 ? (
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', padding: '10px' }}>No tienes muebles en propiedad.</div>
              ) : (
                furnitureInventory.map((item) => {
                  const catalogData = catalogFurniture.find((c) => c.id === item.catalogId);
                  if (!catalogData) return null;
                  return (
                    <div key={item.uid} className="glass-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold' }}>{catalogData.icon} {catalogData.name}</div>
                        <button onClick={() => handleSpawnFurniture(item)} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '8.5px', fontWeight: 'bold', cursor: 'pointer' }}>Colocar</button>
                      </div>

                      {catalogData.canChangeColor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>Color Caja:</span>
                          <input type="color" value={item.color || '#ffffff'} onChange={(e) => handleUpdateFurnitureColor(item.uid, e.target.value)} style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '3px', cursor: 'pointer' }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                        <span style={{ fontSize: '8px', color: '#94a3b8' }}>Venta: <b style={{ color: '#facc15' }}>${catalogData.sellPrice.toLocaleString()}</b></span>
                        <button onClick={() => handleSellFurniture(item.uid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '8px', cursor: 'pointer' }}>Vender</button>
                      </div>
                    </div>
                  );
                })
              )}

              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', marginTop: '6px' }}>TIENDA DE MUEBLES</div>
              {catalogFurniture.map((f) => (
                <div key={f.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 'bold' }}>{f.icon} {f.name}</div>
                    <div style={{ fontSize: '8.5px', color: '#38bdf8', marginTop: '1px' }}>$ {f.buyPrice.toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleBuyFurniture(f)} style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Comprar
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inventario' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {Object.keys(inventory || {}).length === 0 ? (
                <div style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'center', marginTop: '15px' }}>Inventario vacío.</div>
              ) : (
                (Object.entries(inventory) as [string, number][]).map(([id, qty]) => {
                  if (qty <= 0) return null;
                  const prod = catalogProducts.find((p) => p.id === id);
                  const basePrice = prod ? prod.unitPrice : 1000;
                  const currentSalePrice = salePrices[id] !== undefined ? salePrices[id] : basePrice + 500;

                  return (
                    <div key={id} style={{ background: '#1e293b', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod ? prod.icon : '📦'} {prod ? prod.name : id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>Precio: $</span>
                          <input 
                            type="number" 
                            value={currentSalePrice} 
                            onChange={(e) => handlePriceChange(id, e.target.value, basePrice)} 
                            style={{ width: '70px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '8.5px', fontWeight: 'bold', borderRadius: '3px', padding: '1px 4px', outline: 'none' }} 
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {Number(qty)} unid.
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'estado' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>❤️ Salud ({currentHealth}%)</div>
                <div style={{ width: '100%', height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${currentHealth}%`, height: '100%', background: currentHealth > 20 ? '#38bdf8' : '#ef4444' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>🍗 Hambre ({playerState?.hunger ?? 100}%)</div>
                <div style={{ width: '100%', height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${playerState?.hunger ?? 100}%`, height: '100%', background: '#fb923c' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>📦 Ventas Totales</div>
                <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: 'bold' }}>{totalSalesCount} unds</div>
              </div>
              {isDead && (
                <div>
                  {recoveryError && <div style={{ fontSize: '8.5px', color: '#f87171', marginBottom: '4px' }}>{recoveryError}</div>}
                  <button onClick={handleRecoverHealth} disabled={recovering} style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {recovering ? 'Procesando...' : '🏥 Curarse'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeChats.map((chat) => (
                <div key={chat.id} style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '10.5px', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '14px' }}>{chat.avatar}</span><span>{chat.npcName}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#f1f5f9', lineHeight: '1.3', marginBottom: '8px', background: '#0f172a', padding: '6px 8px', borderRadius: '6px' }}>
                    "{chat.message}"
                  </div>
                  {!chat.answered ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {chat.options.map((opt, idx) => (
                        <button key={idx} onClick={() => handleAnswerChat(chat.id, idx)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '5px', fontSize: '9.5px', lineHeight: '1.2', textAlign: 'left', cursor: 'pointer' }}>
                          👉 {opt.text}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: chat.isPositive ? '#4ade80' : '#f87171', padding: '4px 0' }}>{chat.statusText}</div>
                  )}
                </div>
              ))}
              {activeChats.every((c) => c.answered) && (
                <button onClick={loadNewRandomChats} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                  🔄 Nuevos Mensajes
                </button>
              )}
            </div>
          )}

          {activeTab === 'banco' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>🏦 Sistema Financiero y Créditos</div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', lineHeight: '1.3' }}>
                  Sube de nivel para desbloquear préstamos más altos. Las cuotas se cobran automáticamente cada día.
                </div>
              </div>

              {activeLoan ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>⚠️ Préstamo Activo</div>
                  <div style={{ fontSize: '9px', color: '#fff', marginBottom: '2px' }}>Entidad: <b>{activeLoan.bankName}</b></div>
                  <div style={{ fontSize: '9px', color: '#fff', marginBottom: '2px' }}>Deuda Restante: <span style={{ color: '#f87171', fontWeight: 'bold' }}>$ {Math.round(activeLoan.remainingDebt).toLocaleString()}</span></div>
                  <div style={{ fontSize: '9px', color: '#fff' }}>Cuota Diaria: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>$ {activeLoan.dailyInstallment.toLocaleString()}</span></div>
                </div>
              ) : (
                bankOffers.map((offer) => {
                  const unlocked = (playerState?.level ?? 1) >= offer.minLevel;
                  return (
                    <div key={offer.id} style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', opacity: unlocked ? 1 : 0.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{offer.icon} {offer.bankName}</span>
                        <span style={{ fontSize: '8.5px', color: unlocked ? '#4ade80' : '#f87171' }}>{unlocked ? 'Disponible' : `Nivel ${offer.minLevel}+`}</span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '6px' }}>
                        Préstamo: <b>$ {offer.loanAmount.toLocaleString()}</b> | Cuota: <b>$ {offer.dailyInstallment.toLocaleString()}/día</b>
                      </div>
                      <button 
                        onClick={() => handleRequestLoan(offer)}
                        disabled={!unlocked}
                        style={{ width: '100%', background: unlocked ? '#f59e0b' : '#334155', color: '#000', border: 'none', padding: '6px', borderRadius: '5px', fontSize: '9.5px', fontWeight: 'bold', cursor: unlocked ? 'pointer' : 'not-allowed' }}
                      >
                        Solicitar Préstamo
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        <button onClick={close} style={{ background: '#334155', color: '#ffffff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer', marginTop: '6px' }}>
          Guardar Celular (N)
        </button>
      </div>
    </>
  );
};

export default PhoneUI;