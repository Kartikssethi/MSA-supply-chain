import json
import os
from aiokafka import AIOKafkaProducer

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

producer = None

async def start_producer():
    global producer
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await producer.start()

async def stop_producer():
    await producer.stop()

async def send_event(topic: str, data: dict):
    await producer.send_and_wait(
        topic,
        json.dumps(data).encode("utf-8")
    )