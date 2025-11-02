from pydantic import BaseModel
from typing import Literal, List
from datetime import datetime

# --- Schemas de Produto (existentes) ---

class ProdutoBase(BaseModel):
    name: str
    description: str
    price: float
    image: str
    category: Literal["beer", "food"] 

class ProdutoCreate(ProdutoBase):
    id: str 

class Produto(ProdutoBase):
    id: str

    class Config:
        from_attributes = True

# --- NOVOS Schemas de Pedido ---

# 2.1 Item de Pedido para ENTRADA (O que o frontend envia no carrinho)
class CartItem(BaseModel):
    produto_id: str
    quantity: int

# 2.2 Pedido para CRIAÇÃO (O que a rota POST /pedidos/ espera)
class PedidoCreate(BaseModel):
    items: List[CartItem]
    # Aqui você poderia adicionar campos como 'user_id', 'shipping_address', etc.

# 2.3 Item de Pedido para SAÍDA (O que o backend retorna)
class PedidoItem(BaseModel):
    produto_id: str
    produto_name: str
    unit_price: float
    quantity: int

    class Config:
        from_attributes = True

# 2.4 Pedido para SAÍDA (O que a rota GET /pedidos/ retorna)
class Pedido(BaseModel):
    id: int
    pedido_date: datetime
    total_price: float
    status: str
    items: List[PedidoItem] # Inclui os itens do pedido

    class Config:
        from_attributes = True

        