from dotenv import load_dotenv
import os

load_dotenv()

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
