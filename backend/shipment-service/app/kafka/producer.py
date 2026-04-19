import json
import os
import logging
from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

producer = None

async def start_producer():
    global producer
    try:
        producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
        await producer.start()
        logger.info("✅ Kafka producer started")
    except Exception as e:
        logger.warning(f"⚠️ Kafka not available at {KAFKA_BOOTSTRAP_SERVERS}. Events will be skipped. Error: {e}")
        producer = None

async def stop_producer():
    if producer:
        await producer.stop()
        logger.info("Kafka producer stopped")

async def send_event(topic: str, data: dict):
    if not producer:
        # Silently skip if Kafka is not available
        return
    try:
        await producer.send_and_wait(
            topic,
            json.dumps(data).encode("utf-8")
        )
    except Exception as e:
        logger.error(f"Failed to send Kafka event to {topic}: {e}")