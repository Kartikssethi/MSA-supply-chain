from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


load_dotenv(dotenv_path=".env")

DATABASE_URL = os.getenv("DATABASE_URL")

connect_args = {"sslmode": "require"} if DATABASE_URL and DATABASE_URL.startswith("postgresql") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()