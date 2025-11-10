**Project Summary: Stockmeter Web Application**

**Stockmeter**, a modern web application designed to help investors quickly and confidently assess the fair value of global stocks using automated, industry-standard valuation models. The app makes stock analysis accessible and transparent for users of all levels.

### Key Features and How It Works

- **Stock Search and Discovery**
    - Instantly search for stocks by ticker or company name from global exchanges.
    - See relevant stock information, including ticker, name, and exchange, with autocomplete for faster results.
- **Automated Fair Value Calculation**
    - For each stock, the system automatically collects financial data from trusted APIs.
    - It runs up to four different calculations: Discounted Cash Flow (DCF), Dividend Discount Model (DDM), Price/Earnings (PE, PB, PS ratios), and the Graham Number.
    - Results show whether a stock is undervalued, fairly priced, or overvalued, using clear color indicators.
    - Users can view the assumptions and full calculation breakdowns for transparency.
- **Side-by-side Stock Comparison**
    - Compare multiple stocks at once in a single table (Pro users: up to 50 stocks, Free users: single stock).
- **Personal Watchlist**
    - Users can save stocks they want to monitor.
    - Free users can add up to 5 stocks; Pro users get unlimited watchlist entries.
- **Email Alerts (Pro)**
    - Set up custom alerts for when a stock’s valuation hits your target.
    - Get notified by email when conditions are met.
- **Flexible Account System**
    - Register and log in via email, Google, or social platforms.
    - Secure authentication with passwords encrypted for your safety.
- **Subscription and Payments**
    - Free and Pro (paid) tiers for access to additional features.
    - Pro subscription supports payments by Stripe, PayPal, or Midtrans.
    - Easy account upgrades and transparent billing.
- **Export Results (Pro)**
    - Download fair value analyses as CSV or PDF for use in your own workflows.


### Technology and Security

- **User-Friendly Interface:** Built with Nuxt.js for fast, responsive performance on desktop and mobile.
- **Reliable Backend:** Node.js/Express server, PostgreSQL database, and integration with multiple financial data sources.
- **Robust API Integration:** Automatically switches to backup data sources if one provider fails, ensuring reliable service.
- **Caching and Performance:** Uses Redis to cache data for efficiency and cost savings.
- **Security:** Follows best practices for password protection, API security, and payment handling. No sensitive payment data is stored by Stockmeter.


### User Experience

- **Mobile-Ready:** Fully responsive design, works smoothly on phones and tablets.
- **Localization:** Supports English and Indonesian languages, displays prices in your preferred currency.
- **Clear Flows:**
    - Easy onboarding and account management
    - Straightforward stock search and analysis process
    - Fast, reliable performance


### App Summary

- A professional, secure, and scalable web application
- All core features as listed above for both Free and Pro subscription levels
- Documentation for deployment, development, and user operation
- Scalable cloud deployment ready for real-world use
- Clean, modern design tailored to your branding needs

