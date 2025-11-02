from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

# --- Tabela existente de Produtos ---
class Produto(Base):
    __tablename__ = "produtos"

    id = Column(String, primary_key=True, index=True) 
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image = Column(String)
    category = Column(String)

# --- NOVA Tabela de Pedidos ---
class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_date = Column(DateTime, default=datetime.utcnow)
    total_price = Column(Float)
    status = Column(String, default="pending") # Ex: pending, approved, shipped, delivered
    
    # Relação com PedidoItems: um Pedido tem muitos Itens
    items = relationship("PedidoItem", back_populates="pedido")

# --- NOVA Tabela de Itens do Pedido ---
class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    produto_id = Column(String, index=True) # ID do Produto
    produto_name = Column(String)           # Guardamos o nome caso o produto seja removido
    unit_price = Column(Float)              # Preço no momento da compra
    quantity = Column(Integer)

    # Relação com Pedido: um Item pertence a um Pedido
    pedido = relationship("Pedido", back_populates="items")

# Exemplo de uma tabela de Pedido/Item de Pedido (Pedido/PedidoItem)
# Para este exemplo inicial, focaremos apenas em listar os produtos.
# Se quiser implementar a funcionalidade de Checkout, precisaria de uma tabela de pedidos:
# class PedidoItem(Base):
#     __tablename__ = "pedido_items"
#     id = Column(Integer, primary_key=True, index=True)
#     pedido_id = Column(Integer, ForeignKey("pedidos.id"))
#     produto_id = Column(String, ForeignKey("produtos.id"))
#     quantity = Column(Integer)
#     ...