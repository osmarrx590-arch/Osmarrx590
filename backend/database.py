from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexão com o banco de dados.
# sqlite:///./sql_app.db cria um arquivo local chamado sql_app.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./choperia.db" 

# create_engine é responsável pela comunicação com o DB
# connect_args é necessário apenas para SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Cria uma sessão do banco de dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para criar as classes de modelos
Base = declarative_base()

# Função utilitária para obter a sessão do DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()