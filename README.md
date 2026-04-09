# SmartCart AI

**Intelligent Product Curating & Price Analysis System with AI Chatbot**

SmartCart AI is a complete hackathon-ready e-commerce platform built to seamlessly integrate a modern shopping experience with advanced AI capabilities. It uses an Indigo/Blue theme with glassmorphism for a premium UI and intelligent APIs for smart interactions.

## Features

- **Smart Product Search:** Filter by Keyword, Category, Price Range, and Rating.
- **Dynamic Pricing:** Views discounts, credit card offers, and calculates EMI breakdowns automatically.
- **Price Analysis Dashboard:** Interactive historic price tracking powered by Chart.js.
- **AI Shopping Assistant:** Floating Sarvam AI Chatbot that answers questions based on contextual product data.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (zero-build for quick prototyping). Chart.js, FontAwesome.
- **Backend:** Python + Flask
- **AI Integration:** Sarvam AI models for chat completions
- **Database:** Local `dataset.json` (Hackathon speed)

## Project Setup

### 1. Prerequisites
- Python 3.8+
- Sarvam API Key

### 2. Installation
Clone or navigate to the project directory, then create a virtual environment:

```bash
python -m venv venv
```

Activate the environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and add your Sarvam API Key:

```bash
cp .env.example .env
```
Open `.env` and set:
`SARVAM_API_KEY=your_actual_key_here`

### 4. Run the Application
Start the Flask backend server:

```bash
python app.py
```

Open your browser and navigate to:
[http://localhost:5000](http://localhost:5000)

## API Endpoints Reference
- `GET /` Serves the main UI
- `GET /api/products` Fetches products (supports formatting like `?query=sony&min_price=1000&sort=price_asc`)
- `POST /api/chat` Chatbot endpoint. Body: `{"message": "What is the best phone under 150000?"}`
