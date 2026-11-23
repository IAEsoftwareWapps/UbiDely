import { useState } from 'react';
import { Search, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  CurrencyCode,
  DeliveryCategory,
  DeliveryProduct,
  ExchangeRates,
  ServiceCity,
  formatDualPrice,
} from '../data/ubidelyData';
import { ImageWithFallback } from './ImageWithFallback';

export interface CartItem {
  product: DeliveryProduct;
  quantity: number;
}

interface DeliveryScreenProps {
  selectedCity: ServiceCity;
  catalog: DeliveryProduct[];
  activeCurrency: CurrencyCode;
  rates: ExchangeRates;
  cart: CartItem[];
  onAddToCart: (product: DeliveryProduct) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onOpenCheckout: () => void;
}

const CATEGORIES: DeliveryCategory[] = ['Todos', 'Restaurantes', 'Farmacia', 'Supermercado'];

export function DeliveryScreen({
  selectedCity,
  catalog,
  activeCurrency,
  rates,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCheckout,
}: DeliveryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<DeliveryCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = catalog.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.merchant.toLowerCase().includes(q) ||
      item.zoneLabel.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const subtotalUsd = cart.reduce((sum, entry) => sum + entry.product.priceUsd * entry.quantity, 0);
  const deliveryFeeUsd = cart.length > 0 ? 1.9 : 0;
  const totalUsd = Number((subtotalUsd + deliveryFeeUsd).toFixed(2));
  const totalDual = formatDualPrice(totalUsd, activeCurrency, rates);
  const subtotalDual = formatDualPrice(subtotalUsd, activeCurrency, rates);
  const feeDual = formatDualPrice(deliveryFeeUsd, activeCurrency, rates);

  const getQty = (id: string) => cart.find((c) => c.product.id === id)?.quantity ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E1E3E1]">
              Delivery en {selectedCity.name}
            </h1>
            <p className="text-sm text-[#A0ABA6] mt-0.5">
              Restaurantes, farmacias y mercados afiliados con entrega directa en {selectedCity.region}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6C7A75] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar platos, comercios, farmacia o sector..."
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#111413] border border-[#24302C] text-sm text-[#E1E3E1] placeholder-[#6C7A75] focus:outline-none focus:border-[#7EF8E6] focus:ring-2 focus:ring-[#7EF8E6]/20 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[44px] px-4 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#7EF8E6]/12 border-[#7EF8E6] text-[#7EF8E6]'
                      : 'bg-[#191D1C] border-[#24302C] text-[#A0ABA6] hover:border-[#354A44] hover:text-[#E1E3E1]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-[#191D1C] border border-[#24302C] rounded-2xl p-10 text-center space-y-3">
            <p className="text-base font-semibold text-[#E1E3E1]">
              No se encontraron comercios o productos
            </p>
            <p className="text-sm text-[#A0ABA6]">
              Intenta limpiar la búsqueda o volver a ver todas las categorías.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
              className="min-h-[44px] px-5 rounded-full bg-[#006A60] hover:bg-[#004D40] text-sm font-semibold text-[#E1E3E1] transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product, index) => {
              const qty = getQty(product.id);
              const dual = formatDualPrice(product.priceUsd, activeCurrency, rates);

              return (
                <article
                  key={product.id}
                  className={`bg-[#191D1C] rounded-2xl overflow-hidden flex flex-col justify-between transition-colors ${
                    qty > 0
                      ? 'border-2 border-[#7EF8E6]'
                      : 'border border-[#24302C] hover:border-[#354A44]'
                  }`}
                >
                  <div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#111413]">
                      <ImageWithFallback
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackTitle={product.merchant}
                        lazy
                        priority={index < 2}
                        maxRetries={3}
                        allowManualRetry
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#A0ABA6] truncate">
                        <span className="font-medium text-[#7EF8E6]">{product.merchant}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.zoneLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{product.prepTime}</span>
                      </div>

                      <h2 className="text-base font-semibold text-[#E1E3E1] leading-snug">
                        {product.name}
                      </h2>

                      <p className="text-xs text-[#A0ABA6] line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-[#24302C]/70">
                    <div>
                      <div className="text-lg font-bold text-[#E1E3E1] tabular-nums">
                        {dual.primary}
                      </div>
                      <div className="text-xs text-[#A0ABA6] tabular-nums">{dual.secondary}</div>
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="min-h-[44px] px-4 rounded-full bg-[#006A60] hover:bg-[#004D40] text-xs font-bold text-[#E1E3E1] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-[#202624] border border-[#354A44] rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[#E1E3E1] hover:bg-[#191D1C] transition-colors cursor-pointer"
                          aria-label={`Quitar uno de ${product.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-[#7EF8E6] tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[#E1E3E1] hover:bg-[#191D1C] transition-colors cursor-pointer"
                          aria-label={`Agregar otro ${product.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <aside className="lg:col-span-4 bg-[#191D1C] border border-[#24302C] rounded-2xl p-5 lg:sticky lg:top-24 space-y-5">
        <div className="flex items-center justify-between border-b border-[#24302C] pb-3.5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#7EF8E6]" />
            <h2 className="text-lg font-semibold text-[#E1E3E1]">Tu Pedido</h2>
          </div>
          <span className="text-xs font-semibold text-[#A0ABA6] tabular-nums">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} art.
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-medium text-[#E1E3E1]">Tu bolsa está vacía</p>
            <p className="text-xs text-[#A0ABA6]">
              Agrega platos, farmacia o mercado fresco para confirmar tu pedido con seguimiento en vivo.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => {
                const lineDual = formatDualPrice(
                  product.priceUsd * quantity,
                  activeCurrency,
                  rates
                );
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-[#24302C]/60 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#E1E3E1] truncate">{product.name}</p>
                      <p className="text-xs text-[#A0ABA6] truncate">
                        {product.merchant} · Cant. {quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-[#E1E3E1] tabular-nums">
                        {lineDual.primary}
                      </div>
                      <div className="text-[11px] text-[#A0ABA6] tabular-nums">
                        {lineDual.secondary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#24302C] text-sm">
              <div className="flex items-center justify-between text-[#A0ABA6]">
                <span>Subtotal</span>
                <span className="tabular-nums">{subtotalDual.primary}</span>
              </div>
              <div className="flex items-center justify-between text-[#A0ABA6]">
                <span>Envío Motorizado ({selectedCity.name})</span>
                <span className="tabular-nums">{feeDual.primary}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#24302C]">
                <span className="font-semibold text-[#E1E3E1]">Total a pagar</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#7EF8E6] tabular-nums">
                    {totalDual.primary}
                  </div>
                  <div className="text-xs text-[#A0ABA6] tabular-nums">{totalDual.secondary}</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCheckout}
              className="w-full h-[52px] rounded-full bg-[#7EF8E6] hover:bg-[#5edac9] text-[#111413] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Confirmar y Pagar Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
