'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/button'; // Adjust the path based on your project structure
import { Globe2 } from 'lucide-react'; // Adjust the path or library based on your project setup
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import OpenAI from 'openai';
import { Line } from 'react-chartjs-2';
// Add this import at the top with your other imports
import ChatWidget from '../voiceagent/page';

// Replace the existing chat widget code with this
// Find this section:
{/* Voice Agent */}
<ChatWidget />

// Fix for missing marker icons in Leaflet
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

const Page = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    radius: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    status: '',
    daysOld: '',
    limit: '50',
    offset: '0',
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]); // Default to New York
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{ [key: number]: any }>({});
  // Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, make API calls through backend
});

// Add this function after your existing state declarations
const generateInsights = async (property: any, priceChange: number) => {
  try {
    const prompt = `
      Analyze this real estate property:
      Location: ${property.city}, ${property.state}
      Current Price: $${property.price}
      Predicted Price Change: $${priceChange}
      Property Type: ${property.propertyType}
      Market Days: ${property.daysOnMarket}
      
      Please provide a JSON object with the following keys:
      {
        "marketAnalysis": "detailed market analysis here",
        "keyFactors": ["factor1", "factor2", "factor3"],
        "recommendations": ["rec1", "rec2", "rec3"],
        "risks": "risks and opportunities analysis",
        "outlook": "future market outlook"
      }
      
      Ensure the response is properly formatted JSON.
    `;
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a real estate analysis expert. Always respond with properly formatted JSON."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    // Parse the response content as JSON
    try {
      return JSON.parse(content || '{}');
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    return null;
  }
};

  // Component to update the map's center dynamically
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, map.getZoom()); // Update the map's center and retain the current zoom level
  return null;
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProperties([]);

    try {
      const params = Object.entries(formData)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const response = await axios.get(`https://api.rentcast.io/v1/listings/sale?${params}`, {
        headers: {
          accept: 'application/json',
          'X-Api-Key': '9d92cdb7df6c474d8110321d6767b8bc', // Replace with your real API key
        },
      });

      setProperties(response.data);
    } catch (err: Error | unknown) {
      console.error(err);
      setError('Failed to fetch property data');
    } finally {
      setLoading(false);
    }
  };

const handleViewOnMap = async (formattedAddress: string) => {
  try {
    // Use the full formatted address for geocoding
    const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      formattedAddress
    )}`;
    console.log(`Nominatim API URL: ${apiUrl}`); // Debugging: Log the API URL
    const response = await axios.get(apiUrl);

    if (response.data.length > 0) {
      const { lat, lon } = response.data[0];
      setMapCenter([parseFloat(lat), parseFloat(lon)]);
    } else {
      alert('Location not found on the map.');
    }
  } catch (err) {
    console.error('Error fetching location:', err);
    alert('Failed to fetch location.');
  }
};


  return (
    <div 
    className="min-h-screen bg-black text-white p-6 flex flex-col relative"
    style={{ paddingBottom: properties.some(p => p.analysis) ? '600px' : '0' }} // Dynamically adjust padding
>
      <h1 className="text-4xl font-bold mb-2 text-center">🔍 Property Search</h1>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Globe2 className="h-6 w-6 text-blue-500" />
          <span className="text-2xl">
            <Link href="/">Kairos Insights</Link>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-xl font-medium text-zinc-400 hover:text-white">
            Home
          </Link>
          <Link href="/property-prediction" className="text-xl font-medium text-blue-500 hover:text-blue-400">
            Properties
          </Link>
          <Link href="/fraud-analysis" className="text-xl font-medium text-zinc-400 hover:text-white">
            Analytics
          </Link>
          <Link href="#" className="text-xl font-medium text-zinc-400 hover:text-white">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xl font-medium text-zinc-400 hover:text-white">
            Login
          </Link>
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
        </div>
      </header>
{/* Voice Agent */}
<ChatWidget />

      

      <form
        onSubmit={handleSearch}
        className="bg-gray-800 p-6 rounded-lg max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
      >
        <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="state" placeholder="State (e.g., TX)" value={formData.state} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="zipCode" placeholder="Zip Code" value={formData.zipCode} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="radius" placeholder="Radius (miles)" value={formData.radius} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        
        <select
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
          className="bg-gray-700 p-2 rounded"
          aria-label="Property Type"
        >
          <option value="">Property Type</option>
          <option value="Single Family">Single Family</option>
          <option value="Condo">Condo</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Manufactured">Manufactured</option>
          <option value="Multi-Family">Multi-Family</option>
          <option value="Apartment">Apartment</option>
          <option value="Land">Land</option>
        </select>

        <input name="bedrooms" placeholder="Bedrooms" value={formData.bedrooms} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="bathrooms" placeholder="Bathrooms" value={formData.bathrooms} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <select 
          name="status" 
          value={formData.status} 
          onChange={handleChange} 
          className="bg-gray-700 p-2 rounded"
          aria-label="Status"
        >
          <option value="">Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>    
        <input name="daysOld" placeholder="Days Old" value={formData.daysOld} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="limit" placeholder="Limit (default 50)" value={formData.limit} onChange={handleChange} className="bg-gray-700 p-2 rounded" />
        <input name="offset" placeholder="Offset (pagination)" value={formData.offset} onChange={handleChange} className="bg-gray-700 p-2 rounded" />

        <button
          type="submit"
          className="col-span-full bg-blue-600 hover:bg-blue-700 p-2 rounded text-white font-semibold"
        >
          Search Properties
        </button>
      </form>

      {loading && <p className="text-center text-gray-300 mt-6">Loading...</p>}
      {error && <p className="text-center text-red-400 mt-4">{error}</p>}
{/* React Leaflet Map with Search Bar */}
<div className="relative mb-6 mt-6">
  {/* Search Bar */}
  <div
    className="absolute top-4 right-4 z-50"
    style={{
      zIndex: 1000, // Ensure it appears above the map
    }}
  >
    <input
      type="text"
      placeholder="Search by zip, city, or address"
      className="bg-white text-black p-2 rounded shadow-md w-64"
      onKeyDown={async (e) => {
        if (e.key === 'Enter') {
          const searchValue = (e.target as HTMLInputElement).value.trim();
          if (searchValue) {
            try {
              const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                searchValue
              )}`;
              console.log(`Search API URL: ${apiUrl}`); // Debugging: Log the API URL
              const response = await axios.get(apiUrl);

              if (response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setMapCenter([parseFloat(lat), parseFloat(lon)]);
              } else {
                alert('Location not found.');
              }
            } catch (err) {
              console.error('Error searching location:', err);
              alert('Failed to search location.');
            }
          }
        }
      }}
    />
  </div>

  {/* Map Component */}
  <MapContainer
    center={mapCenter}
    zoom={13}
    style={{ height: '400px', width: '100%' }}
    className="rounded-lg shadow-lg"
  >
    {/* Dynamically update the map's center */}
    <MapUpdater center={mapCenter} />
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />
    <Marker position={mapCenter}>
      <Popup>Current Location</Popup>
    </Marker>
  </MapContainer>
</div>
      <div className="flex-grow">
      {/* Horizontal Scrollable Properties */}
      <div className="relative">
        {/* Left Scroll Button */}
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
            }
          }}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 rounded-full z-10"
        >
          &lt;
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-4 scrollbar-hide px-10"
          style={{
            width: '100%',
            maxWidth: 'calc(100% - 80px)',
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {properties.map((prop, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-1/4 bg-gray-800 p-5 rounded shadow hover:shadow-lg transition"
              style={{ minWidth: '25%' }}
            >
              <h2 className="text-xl font-bold mb-2">{prop.formattedAddress}</h2>
              <p><strong>City:</strong> {prop.city}</p>
              <p><strong>State:</strong> {prop.state}</p>
              <p><strong>Type:</strong> {prop.propertyType}</p>
              <p><strong>Bedrooms:</strong> {prop.bedrooms}</p>
              <p><strong>Bathrooms:</strong> {prop.bathrooms}</p>
              <p><strong>Sq Ft:</strong> {prop.squareFootage}</p>
              <p><strong>Lot Size:</strong> {prop.lotSize}</p>
              <p><strong>Year Built:</strong> {prop.yearBuilt}</p>
              <p><strong>Status:</strong> {prop.status}</p>
              <p><strong>Price:</strong> ${prop.price}</p>
              <p><strong>Listing Type:</strong> {prop.listingType}</p>
              <p><strong>Listed Date:</strong> {prop.listedData}</p>
              <p><strong>Days on Market:</strong> {prop.daysOnMarket}</p>
              <p><strong>mlsName:</strong> {prop.mlsName}</p>
              <p><strong>mlsNumber:</strong> {prop.mlsNumber}</p>
              <p><strong>Owner:</strong> {prop.owner?.names?.join(', ') || 'N/A'}</p>
                {/* View on Map Button */}
                <button
                  onClick={() => handleViewOnMap(prop.formattedAddress)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                >
                  View on Map
                </button>
              {/* Analyze Market Sentiment Button */}
              <button
                onClick={async () => {
                  try {
                    const response = await axios.post('http://127.0.0.1:8000/analyze', {
                      location: prop.city + ', ' + prop.state,
                      current_price: prop.price,
                    });

                    const updatedProperties = [...properties];
                    updatedProperties[index].analysis = response.data;
                    setProperties(updatedProperties);
                  } catch (error) {
                    console.error('Error analyzing market sentiment:', error);
                    alert('Failed to analyze market sentiment.');
                  }
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Analyze Market Sentiment
              </button>

{/* Wide Animated Tab for Backend Results */}
{prop.analysis && (
  <div
    className={`absolute left-0 right-0 mx-auto bg-gray-800 text-white p-6 rounded-lg shadow-lg transition-transform duration-500 ease-in-out ${
      prop.analysis ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
    }`}
    style={{
      top: '100%', // Position it below the button
      width: '90%', // Make it wide but not full screen
      maxWidth: '800px', // Limit the maximum width
      zIndex: 50, // Ensure it appears above other elements
    }}
  >
    <h3 className="text-xl font-bold mb-4 text-center">Market Sentiment Analysis</h3>
    <p className="text-lg mb-4"><strong>News Headlines with Sentiment:</strong></p>
    <ul className="list-disc list-inside max-h-60 overflow-y-auto">
      {prop.analysis.news_headlines.map((headline: string, i: number) => (
        <li key={i} className="mb-2">
          {prop.analysis.news_links && prop.analysis.news_links[i] ? (
          <a
            href={prop.analysis.news_links[i]} // Add the corresponding link
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline">
          {headline}
          </a>
          ) : (
            <span>{headline}</span>
          )}
          {' - '}
          <span
            className={`font-semibold ${
              prop.analysis.sentiment_labels[i] === 'POSITIVE'
                ? 'text-green-500'
                : 'text-red-500'
            }`}
          >
            {prop.analysis.sentiment_labels[i]}
          </span>
        </li>
      ))}
    </ul>
    <p className="mt-4 text-lg"><strong>Price Change:</strong> ${prop.analysis.price_change.toFixed(2)}</p>
    <img
      src={`data:image/png;base64,${prop.analysis.forecast_image}`}
      alt="Price Forecast"
      className="mt-4 w-full max-w-md mx-auto"
    />
    <button
      onClick={() => {
        const updatedProperties = [...properties];
        updatedProperties[index].analysis = null; // Close the tab
        setProperties(updatedProperties);
      }}
      className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded block mx-auto"
    >
      Close
    </button>
    
    <button
    onClick={async () => {
      try {
        const aiInsights = await generateInsights(prop, prop.analysis.price_change);
        
        if (aiInsights) {
          setInsights({
            ...insights,
            [index]: {
              ...aiInsights,
              priceData: {
                labels: ['Current', '3 Months', '6 Months', '9 Months', '12 Months'],
                datasets: [{
                  label: 'Projected Price',
                  data: [
                    prop.price,
                    prop.price + (prop.analysis.price_change * 0.25),
                    prop.price + (prop.analysis.price_change * 0.5),
                    prop.price + (prop.analysis.price_change * 0.75),
                    prop.price + prop.analysis.price_change
                  ],
                  borderColor: prop.analysis.price_change > 0 ? '#4ade80' : '#ef4444',
                  tension: 0.1
                }]
              }
            }
          });
        }
      } catch (error) {
        console.error('Error generating insights:', error);
        alert('Failed to generate insights');
      }
    }}
    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
  >
    Get AI Insights
  </button>
</div>
)}
{/* AI Insights Panel */}

{insights[index] && (
  <div className="mt-8 p-6 bg-gray-700 rounded-lg">
    <h3 className="text-2xl font-bold mb-4">AI Property Insights</h3>
    
    {/* Price Projection Chart */}
    <div className="mb-6 bg-gray-800 p-4 rounded">
      <h4 className="text-xl font-semibold mb-4">Price Projection</h4>
      <Line data={insights[index].priceData} options={{
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: 'white'
            }
          }
        }
      }} />
    </div>
    
    

    {/* Market Analysis */}
    <div className="mb-6">
      <h4 className="text-xl font-semibold mb-2">Market Analysis</h4>
      <p className="text-gray-200">{insights[index].marketAnalysis}</p>
    </div>
    {/* Key Factors */}
    <div className="mb-6">
      <h4 className="text-xl font-semibold mb-2">Key Factors</h4>
      <ul className="list-disc list-inside space-y-2">
        {insights[index].keyFactors.map((factor: string, i: number) => (
          <li key={i} className="text-gray-200">{factor}</li>
        ))}
      </ul>
    </div>

    {/* Recommendations */}
    <div className="mb-6">
      <h4 className="text-xl font-semibold mb-2">Investment Recommendations</h4>
      <ul className="list-disc list-inside space-y-2">
        {insights[index].recommendations.map((rec: string, i: number) => (
          <li key={i} className="text-gray-200">{rec}</li>
        ))}
      </ul>
    </div>

    {/* Risks and Opportunities */}
    <div className="mb-6">
      <h4 className="text-xl font-semibold mb-2">Risks and Opportunities</h4>
      <p className="text-gray-200">{insights[index].risks}</p>
    </div>

    {/* Market Outlook */}
    <div className="mb-6">
      <h4 className="text-xl font-semibold mb-2">Future Market Outlook</h4>
      <p className="text-gray-200">{insights[index].outlook}</p>
    </div>
  

  </div>
      )}
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 rounded-full z-10"
        >
          &gt;
        </button>
      </div>
    
    </div>
    <div className="h-32"></div>
    </div>
        
  );
}

export default Page;
