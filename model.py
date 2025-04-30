# model.py

import requests
import datetime
import numpy as np
import matplotlib.pyplot as plt
import base64
import io
import os
from transformers import pipeline
from statsmodels.tsa.arima.model import ARIMA

# Initialize sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
def get_newsapi_headlines(location: str, api_key: str, from_date: str):
    url = (
        f"https://newsapi.org/v2/everything?q=real+estate+{location}&from={from_date}"
        f"&sortBy=publishedAt&apiKey={api_key}"
    )
    response = requests.get(url)
    articles = response.json().get("articles", [])
    return [a['title'] for a in articles if 'title' in a]

def get_nyt_headlines(location: str, api_key: str):
    query = f"real estate {location}"
    today = datetime.datetime.today().strftime("%Y%m%d")
    one_month_ago = (datetime.datetime.today() - datetime.timedelta(days=30)).strftime("%Y%m%d")
    
    url = (
        f"https://api.nytimes.com/svc/search/v2/articlesearch.json?q={query}"
        f"&begin_date={one_month_ago}&end_date={today}"
        f"&fq=section.name:(\"Real Estate\") AND source.vernacular:(\"The New York Times\")"
        f"&api-key={api_key}"
    )
    response = requests.get(url)
    docs = response.json().get("response", {}).get("docs", [])
    return [doc['headline']['main'] for doc in docs if 'headline' in doc and 'main' in doc['headline']]

def analyze_sentiment(location: str, current_price: float):
    # Fetch news headlines
    api_key = os.getenv("NEWS_API_KEY")
    from_date = (datetime.datetime.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    headlines = get_newsapi_headlines(location, api_key, from_date)

    # Analyze sentiment
    sentiments = sentiment_analyzer(headlines)
    sentiment_labels = [r['label'] for r in sentiments]

    # Forecast prices
    sentiment_scores = [1 if label == 'POSITIVE' else -1 for label in sentiment_labels]
    forecast = forecast_prices(current_price, sentiment_scores)

    # Generate forecast image
    forecast_image = plot_price_forecast(current_price, forecast)

    return {
        "news_headlines": headlines,
        "sentiment_labels": sentiment_labels,
        "forecast_image": forecast_image,
        "price_change": forecast[-1] - current_price
    }

def forecast_prices(current_price: float, sentiments: list):
    sentiment_score = np.cumsum(sentiments)
    # Generate synthetic historical prices influenced by sentiment
    base_price = current_price * 0.9
    noise = np.random.normal(0, 1, len(sentiment_score))
    history = base_price + 2 * sentiment_score + noise
    model = ARIMA(history, order=(2, 1, 2))
    fitted_model = model.fit()
    forecast = fitted_model.forecast(steps=10)
    future_prices = [current_price + f for f in forecast]
    return future_prices

def plot_price_forecast(current_price, forecast):
    years = list(range(1, 11))
    plt.figure(figsize=(10, 5))
    plt.plot(years, forecast, label="Forecasted Price", color="green")
    plt.axhline(y=current_price, color="blue", linestyle="--", label="Current Price")
    plt.xlabel("Years")
    plt.ylabel("Price ($)")
    plt.title("10-Year Property Price Forecast")
    plt.legend()
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")
    return img_base64


def summarize_trend_with_gemini(location, headlines, forecast):
    import google.generativeai as genai
    
    # Configure the Gemini API
    genai.configure(api_key="your-gemini-api-key")
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""
    Analyze the impact of the following real estate news headlines from {location} on future property prices:
    Headlines: {headlines}
    Forecasted price changes over 10 years: {forecast}

    Provide a concise analysis of the overall market trend and possible causes.
    """
    
    response = model.generate_content(prompt)
    return response.text
