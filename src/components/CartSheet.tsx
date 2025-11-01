import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/pages/Index";
import { Separator } from "@/components/ui/separator";

interface CartSheetProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
  totalPrice: number;
}

const CartSheet = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onCheckout,
  totalPrice,
}: CartSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-2xl">Seu Carrinho</SheetTitle>
          <SheetDescription>
            {cart.length === 0
              ? "Seu carrinho está vazio"
              : `${cart.length} ${cart.length === 1 ? "item" : "itens"} no carrinho`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-4 max-h-[60vh] overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="text-4xl">{item.image}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{item.name}</h4>
                <p className="text-sm text-primary font-bold">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  {item.quantity === 1 ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </Button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg text-lg font-bold"
                onClick={onCheckout}
              >
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
