from dotenv import load_dotenv
import os

load_dotenv()

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")

# Apify actor IDs
DISCORD_ACTOR_ID = "curious_coder/discord-data-scraper"
BILIBILI_ACTOR_ID = "kuaima/bilibili"

# Data output directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
