from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import os
from model import analyze_sentiment
import uvicorn

# Load environment variables (ensure you have your API keys in .env or set them in your system)
from dotenv import load_dotenv
load_dotenv()

# FastAPI instance
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for frontend input
class PropertyRequest(BaseModel):
    location: str
    current_price: float

# Response model for frontend output
class MarketSentimentResponse(BaseModel):
    news_headlines: List[str]
    sentiment_labels: List[str]
    forecast_image: str
    price_change: float

# Endpoint to analyze market sentiment and predict property prices
@app.post("/analyze", response_model=MarketSentimentResponse)
async def analyze_property_market(request: PropertyRequest):
    # Extract information from request
    location = request.location
    current_price = request.current_price
    
    # Analyze sentiment and predict property price trend
    result = analyze_sentiment(location, current_price)
    
    # Return response with sentiment analysis, headlines, and predicted price change
    return {
        "news_headlines": result["news_headlines"],
        "sentiment_labels": result["sentiment_labels"],
        "forecast_image": result["forecast_image"],
        "price_change": result["price_change"]
    }

# To run the FastAPI server with Uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

print(os.getenv("NEWS_API_KEY"))
print(os.getenv("NYT_API_KEY"))