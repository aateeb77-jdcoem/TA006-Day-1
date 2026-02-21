# SmartCart AI - Pitch Deck Outline

**Slide 1: Title Slide**
- **Project Name**: SmartCart AI
- **Tagline**: Intelligent Product Curating & Price Analysis System
- **Team Name / Names**: [Your Team / Name]
- *Visual*: Clean logo / Application screenshot

**Slide 2: Problem Statement**
- Shoppers are overwhelmed by choices across e-commerce platforms.
- It's difficult to track historical prices to know if a "discount" is real.
- Understanding credit card offers and calculating EMI is confusing.

**Slide 3: Our Solution**
- SmartCart AI centralizes products into an intelligent, curated view.
- Provides a Price Analysis Dashboard to buy at the perfect time.
- Uses Generative AI (Sarvam) to instantly answer questions about offers and comparisons.

**Slide 4: Key Features**
- **Smart Filters:** Multi-faceted search (Category, Price, Rating, Sort).
- **Price Analysis:** 3-month historical price trend graph (`Chart.js`).
- **Financial Details:** Auto-calculates EMI & highlights card offers on every product.
- **AI Chatbot:** Context-aware shopping assistant.

**Slide 5: Technology Stack**
- **Frontend**: HTML, CSS, JavaScript (Glassmorphism, Dark Mode)
- **Backend**: Python (Flask)
- **AI Engine**: Sarvam API
- **Data & Charts**: Local JSON dataset (fast iteration), Chart.js

**Slide 6: Architecture & Workflow**
- *Diagram*:
    1. User -> UI (Filters / Chat).
    2. UI -> Flask Backend API -> Fetches from dataset / calls Sarvam API.
    3. Flask API injects localized product context to the AI model.
    4. Response -> Renders dynamically on the UI.

**Slide 7: Demo Time!**
- *Visual*: A bold "Live Demo" text block.
- Be prepared to show:
    - Filtering by category and sliding the price bar.
    - Opening the Price Analysis Graph.
    - Asking the AI: "Which phone has the best EMI option?"

**Slide 8: Business Value / Impact**
- **For Users**: Saves time, saves money by tracking real prices, simplifies buying.
- **For E-commerce Platforms**: Increases conversion rates (users don't have to leave the site to check bank deal calculations). Reduces customer support loads through the AI agent.

**Slide 9: Future Roadmap**
- Connect to live product APIs (Amazon/Flipkart affiliate APIs).
- Implement a real NoSQL Database (MongoDB) for user profiles and saved carts.
- Add personalized push notifications when a watched item hits its lowest price.

**Slide 10: Q&A**
- "Questions?"
- Thank you!
- Contact information / GitHub Link.
