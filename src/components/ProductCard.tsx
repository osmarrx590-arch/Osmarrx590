import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Product } from "@/pages/Index";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-8xl">
        {product.image}
      </div>
      <div className="p-5">
        <h4 className="font-bold text-lg mb-2 text-foreground">{product.name}</h4>
        <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            R$ {product.price.toFixed(2)}
          </span>
          <Button 
            onClick={() => onAddToCart(product)}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
