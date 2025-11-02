import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Beer, UtensilsCrossed } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ProdutoCard from "@/components/ProdutoCard";
import CartSheet from "@/components/CartSheet";
import CheckoutDialog from "@/components/CheckoutDialog";

export type Produto = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "beer" | "food";
};

export type CartItem = Produto & { quantity: number };

// Produtos carregados do backend

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  const addToCart = (produto: Produto) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === produto.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === produto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...produto, quantity: 1 }];
    });
    toast({
      title: "Adicionado ao carrinho!",
      description: `${produto.name} foi adicionado`,
    });
  };

  const updateQuantity = (produtoId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== produtoId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === produtoId ? { ...item, quantity } : item
        )
      );
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive"
      });
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Busca produtos do backend ao montar o componente
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProdutos = async () => {
      setLoading(true);
      try {
      // Ajuste a URL conforme necessário (backend em PT: /produtos/)
      const response = await fetch("http://127.0.0.1:8000/produtos/", { signal });
        if (!response.ok) {
          throw new Error(`Falha ao buscar produtos (status ${response.status})`);
        }
        const data: Produto[] = await response.json();
        setProdutos(data);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Fetch abortado — silencioso
          return;
        }
        console.error("Erro ao carregar produtos:", error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível carregar os produtos do servidor.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choperia Digital</h1>
              <p className="text-sm text-muted-foreground">As melhores cervejas da cidade</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            className="relative border-2 hover:border-primary hover:bg-primary/10 transition-all"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrinho
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Saboreie o Melhor
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cervejas artesanais e petiscos deliciosos, entregues com rapidez e qualidade
          </p>
        </div>
      </section>

      {/* Produtos Section */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Beer className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Cervejas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {loading ? (
                <div>Carregando produtos...</div>
              ) : (
                produtos.filter(p => p.category === "beer").map(produto => (
                  <ProdutoCard 
                    key={produto.id} 
                    produto={produto} 
                    onAddToCart={addToCart}
                  />
                ))
              )}
          </div>

          <div className="flex items-center gap-3 mb-8">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Petiscos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div>Carregando produtos...</div>
              ) : (
                produtos.filter(p => p.category === "food").map(produto => (
                  <ProdutoCard 
                    key={produto.id} 
                    produto={produto} 
                    onAddToCart={addToCart}
                  />
                ))
              )}
          </div>
        </div>
      </section>

      {/* Cart Sheet */}
      <CartSheet
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onCheckout={handleCheckout}
        totalPrice={getTotalPrice()}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        totalPrice={getTotalPrice()}
        onSuccess={() => {
          setCart([]);
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
