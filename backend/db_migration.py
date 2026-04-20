import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

def run_migration():
    try:
        # Connect to your postgres DB
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("Adding shipment_date to shipments table...")
        cur.execute("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipment_date TIMESTAMP;")
        
        print("Adding shipment_date to vehicles table...")
        cur.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS shipment_date TIMESTAMP;")

        conn.commit()
        cur.close()
        conn.close()
        print("Migration completed successfully! ✅")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
