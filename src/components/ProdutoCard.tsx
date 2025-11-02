import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Produto } from "@/pages/Index";

interface ProdutoCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
}

const ProdutoCard = ({ produto, onAddToCart }: ProdutoCardProps) => {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-8xl">
        {produto.image}
      </div>
      <div className="p-5">
        <h4 className="font-bold text-lg mb-2 text-foreground">{produto.name}</h4>
        <p className="text-sm text-muted-foreground mb-4">{produto.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            R$ {produto.price.toFixed(2)}
          </span>
          <Button 
            onClick={() => onAddToCart(produto)}
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

export default ProdutoCard;
