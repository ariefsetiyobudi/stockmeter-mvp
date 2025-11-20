# Requirements Document

## Introduction

Stockmeter is a web application that automatically calculates and displays the fair value of global stocks using multiple industry-standard financial valuation models. The system integrates with financial data APIs to source historical company financials and price data, performs automated calculations using various valuation models (DCF, DDM, P/E ratios, Graham Number), and presents results through a modern web interface. The application supports both free and premium subscription tiers with payment processing and alert notifications for premium users.

## Glossary

- **Stockmeter System**: The complete web application including backend API, frontend interface, database, and external integrations
- **Financial Data Provider**: External API services (Yahoo Finance, Financial Modeling Prep, Alpha Vantage, Twelve Data) that supply stock prices and financial statements
- **Valuation Model**: Mathematical formula used to calculate fair value (DCF, DDM, P/E, Graham Number)
- **Fair Value**: Calculated intrinsic value of a stock based on financial data and valuation models
- **Watchlist**: User-defined collection of stock tickers for monitoring
- **Alert Threshold**: User-configured condition that triggers notification when stock valuation meets criteria
- **Free Tier User**: Authenticated user with basic access limitations
- **Pro Tier User**: Authenticated user with paid subscription and full feature access
- **Batch Comparison**: Simultaneous fair value calculation for multiple stocks (up to 50)
- **Provider Adapter**: Software component that abstracts external API integration
- **Rate Limit**: Maximum number of API calls allowed within a time period
- **WACC**: Weighted Average Cost of Capital used in DCF calculations
- **DCF Model**: Discounted Cash Flow valuation model
- **DDM Model**: Dividend Discount Model for dividend-paying stocks
- **Graham Number**: Conservative value metric calculation
- **Valuation Status**: Classification of stock as undervalued, fairly priced, or overvalued
- **Local Development Environment**: Developer workstation setup for building and testing before cloud deployment
- **PostgreSQL Database**: Relational database system used for data persistence in both local and production environments

## Requirements

### Requirement 1

**User Story:** As a stock investor, I want to search for stocks by ticker or company name, so that I can quickly find the stocks I want to analyze

#### Acceptance Criteria

1. WHEN a user enters text into the search field, THE Stockmeter System SHALL return matching stock results within 2 seconds
2. THE Stockmeter System SHALL display ticker symbol, company name, and exchange for each search result
3. THE Stockmeter System SHALL support autocomplete functionality with minimum 2 characters entered
4. THE Stockmeter System SHALL search across all supported global exchanges
5. WHERE the search query matches multiple stocks, THE Stockmeter System SHALL display up to 20 results ordered by relevance

### Requirement 2

**User Story:** As a stock investor, I want to view the current price and fair value of a stock, so that I can determine if it is undervalued or overvalued

#### Acceptance Criteria

1. WHEN a user selects a stock, THE Stockmeter System SHALL display the current market price within 3 seconds
2. THE Stockmeter System SHALL calculate fair value using at least 4 valuation models (DCF, DDM, P/E, Graham Number)
3. THE Stockmeter System SHALL display each calculated fair value alongside the current price
4. WHEN fair value exceeds current price by 10% or more, THE Stockmeter System SHALL mark the stock as undervalued with soft green color
5. WHEN current price exceeds fair value by 10% or more, THE Stockmeter System SHALL mark the stock as overvalued with soft red color
6. WHEN the difference between fair value and current price is less than 10%, THE Stockmeter System SHALL mark the stock as fairly priced with white color

### Requirement 3

**User Story:** As a stock investor, I want to see the assumptions used in valuation calculations, so that I can trust and understand the fair value results

#### Acceptance Criteria

1. THE Stockmeter System SHALL display key input values for each valuation model (growth rate, WACC, terminal value assumptions)
2. WHEN a user hovers over a fair value result, THE Stockmeter System SHALL show a tooltip with primary calculation inputs
3. WHERE a Pro Tier User requests detailed breakdown, THE Stockmeter System SHALL provide a page showing complete calculation steps
4. THE Stockmeter System SHALL derive growth rates from historical 5-year CAGR of revenue
5. THE Stockmeter System SHALL use industry average WACC when company-specific data is unavailable

### Requirement 4

**User Story:** As a stock investor, I want to compare multiple stocks side-by-side, so that I can evaluate investment opportunities efficiently

#### Acceptance Criteria

1. WHERE a Pro Tier User selects multiple stocks, THE Stockmeter System SHALL display batch comparison for up to 50 stocks
2. THE Stockmeter System SHALL show ticker, name, current price, fair values, and valuation status in a table format
3. THE Stockmeter System SHALL calculate fair values for all selected stocks within 10 seconds
4. WHERE a Free Tier User attempts batch comparison, THE Stockmeter System SHALL limit comparison to 1 stock and display upgrade prompt
5. THE Stockmeter System SHALL allow users to add or remove stocks from comparison view

### Requirement 5

**User Story:** As a registered user, I want to create a watchlist of stocks, so that I can monitor my investment opportunities over time

#### Acceptance Criteria

1. WHEN an authenticated user adds a stock to watchlist, THE Stockmeter System SHALL persist the ticker in the user database
2. THE Stockmeter System SHALL display all watchlist stocks with current prices and valuation status
3. WHERE a Free Tier User adds stocks to watchlist, THE Stockmeter System SHALL limit watchlist to 5 stocks
4. WHERE a Pro Tier User adds stocks to watchlist, THE Stockmeter System SHALL allow unlimited watchlist entries
5. WHEN a user removes a stock from watchlist, THE Stockmeter System SHALL delete the entry within 1 second

### Requirement 6

**User Story:** As a Pro Tier User, I want to receive alerts when stocks become undervalued, so that I can act on investment opportunities promptly

#### Acceptance Criteria

1. WHEN a Pro Tier User creates an alert with threshold conditions, THE Stockmeter System SHALL store the alert configuration in the database
2. WHEN a stock meets the alert threshold conditions, THE Stockmeter System SHALL send email notification within 15 minutes
3. THE Stockmeter System SHALL check alert conditions at least once every 24 hours
4. WHERE a Free Tier User attempts to create alerts, THE Stockmeter System SHALL display upgrade prompt and prevent alert creation
5. WHEN a Pro Tier User deactivates an alert, THE Stockmeter System SHALL stop sending notifications for that alert

### Requirement 7

**User Story:** As a new user, I want to register and authenticate using multiple methods, so that I can access the platform conveniently

#### Acceptance Criteria

1. THE Stockmeter System SHALL support user registration via email and password
2. THE Stockmeter System SHALL support authentication via Google OAuth
3. THE Stockmeter System SHALL support authentication via social login providers (Facebook, GitHub)
4. WHEN a user successfully authenticates, THE Stockmeter System SHALL create a session valid for 30 days
5. THE Stockmeter System SHALL hash passwords using bcrypt with minimum 10 salt rounds
6. WHEN a user registers, THE Stockmeter System SHALL assign Free Tier subscription status by default

### Requirement 8

**User Story:** As a Free Tier User, I want to upgrade to Pro subscription, so that I can access advanced features and unlimited comparisons

#### Acceptance Criteria

1. WHEN a user initiates subscription purchase, THE Stockmeter System SHALL present payment options (Stripe, PayPal, Midtrans, credit card)
2. THE Stockmeter System SHALL offer monthly subscription at $10-15 per month
3. THE Stockmeter System SHALL offer yearly subscription at $99-129 per year
4. WHEN payment is successfully processed, THE Stockmeter System SHALL update user subscription status to Pro Tier within 30 seconds
5. WHEN payment fails, THE Stockmeter System SHALL display error message and maintain Free Tier status
6. THE Stockmeter System SHALL process payment webhooks from Stripe, PayPal, and Midtrans

### Requirement 9

**User Story:** As a Pro Tier User, I want to export fair value analysis results, so that I can use the data in my own tools and reports

#### Acceptance Criteria

1. WHEN a Pro Tier User requests export, THE Stockmeter System SHALL generate downloadable file in CSV format
2. WHEN a Pro Tier User requests export, THE Stockmeter System SHALL generate downloadable file in PDF format
3. THE Stockmeter System SHALL include ticker, name, current price, all fair values, and valuation status in exports
4. WHERE a Free Tier User attempts export, THE Stockmeter System SHALL display upgrade prompt and prevent download
5. THE Stockmeter System SHALL generate export files within 5 seconds

### Requirement 10

**User Story:** As a system administrator, I want the backend to integrate with multiple financial data providers, so that the system remains operational if one provider fails

#### Acceptance Criteria

1. THE Stockmeter System SHALL implement Provider Adapter pattern for all Financial Data Provider integrations
2. THE Stockmeter System SHALL support Yahoo Finance as primary Financial Data Provider
3. THE Stockmeter System SHALL support Financial Modeling Prep as secondary Financial Data Provider
4. THE Stockmeter System SHALL support Alpha Vantage as tertiary Financial Data Provider
5. WHEN primary Financial Data Provider fails, THE Stockmeter System SHALL automatically failover to secondary provider within 5 seconds
6. THE Stockmeter System SHALL allow addition of new Financial Data Provider without modifying core business logic

### Requirement 11

**User Story:** As a system administrator, I want to cache frequently requested data, so that the system minimizes API costs and avoids rate limits

#### Acceptance Criteria

1. WHEN the Stockmeter System fetches stock price data, THE Stockmeter System SHALL cache the result for 5 minutes
2. WHEN the Stockmeter System fetches financial statements, THE Stockmeter System SHALL cache the result for 24 hours
3. WHEN cached data exists and is not expired, THE Stockmeter System SHALL return cached data without calling Financial Data Provider
4. THE Stockmeter System SHALL track remaining API calls for each Financial Data Provider
5. WHEN Rate Limit threshold reaches 90%, THE Stockmeter System SHALL log warning and switch to alternative provider

### Requirement 12

**User Story:** As a stock investor, I want to access the application on mobile devices, so that I can analyze stocks anywhere

#### Acceptance Criteria

1. THE Stockmeter System SHALL render responsive interface on screen widths from 320px to 2560px
2. THE Stockmeter System SHALL display touch-optimized controls on mobile devices
3. THE Stockmeter System SHALL maintain full functionality on iOS Safari and Android Chrome browsers
4. THE Stockmeter System SHALL load initial page content within 3 seconds on 4G mobile connection
5. THE Stockmeter System SHALL support both portrait and landscape orientations

### Requirement 13

**User Story:** As an international user, I want to view the application in my preferred language and currency, so that I can understand the information easily

#### Acceptance Criteria

1. THE Stockmeter System SHALL support English language interface
2. THE Stockmeter System SHALL support Indonesian language interface
3. WHEN a user selects currency preference, THE Stockmeter System SHALL convert all displayed prices to selected currency
4. THE Stockmeter System SHALL persist language and currency preferences in user profile
5. THE Stockmeter System SHALL use exchange rates updated within 24 hours for currency conversion

### Requirement 14

**User Story:** As a developer, I want to run the application locally with PostgreSQL, so that I can develop and test features before deploying to production

#### Acceptance Criteria

1. THE Stockmeter System SHALL connect to PostgreSQL Database running on localhost during Local Development Environment
2. THE Stockmeter System SHALL provide database migration scripts for PostgreSQL schema setup
3. THE Stockmeter System SHALL use environment variables to configure database connection parameters
4. THE Stockmeter System SHALL run Express.js backend on localhost port 3001 in Local Development Environment
5. THE Stockmeter System SHALL run Next.js frontend on localhost port 3000 in Local Development Environment
6. THE Stockmeter System SHALL provide setup documentation for Local Development Environment configuration

### Requirement 19

**User Story:** As a system administrator, I want to deploy the application using containers, so that the system can scale and maintain consistency across environments

#### Acceptance Criteria

1. THE Stockmeter System SHALL package backend Express.js application as Docker container
2. THE Stockmeter System SHALL package frontend Next.js application as Docker container
3. THE Stockmeter System SHALL deploy containers to Google Cloud Run or Google Kubernetes Engine
4. THE Stockmeter System SHALL use PostgreSQL Database in Google Cloud SQL for production deployment
5. THE Stockmeter System SHALL configure all environment-specific values via environment variables
6. THE Stockmeter System SHALL implement automated deployment pipeline using Google Cloud Build

### Requirement 15

**User Story:** As a stock investor, I want the system to automatically calculate DCF fair value, so that I can evaluate intrinsic value without manual input

#### Acceptance Criteria

1. THE Stockmeter System SHALL retrieve minimum 5 years of historical financial statements for DCF calculation
2. THE Stockmeter System SHALL calculate revenue growth rate from historical 5-year CAGR
3. THE Stockmeter System SHALL project free cash flows for 10 years using historical margin and CapEx trends
4. THE Stockmeter System SHALL apply WACC between 7% and 15% based on industry and company risk profile
5. THE Stockmeter System SHALL calculate terminal value using perpetual growth rate between 2% and 3%
6. THE Stockmeter System SHALL discount projected cash flows to present value and calculate per-share fair value

### Requirement 16

**User Story:** As a stock investor analyzing dividend stocks, I want to see DDM fair value, so that I can evaluate income-generating investments

#### Acceptance Criteria

1. WHEN a stock pays dividends, THE Stockmeter System SHALL calculate fair value using Dividend Discount Model
2. THE Stockmeter System SHALL retrieve minimum 3 years of historical dividend payments
3. THE Stockmeter System SHALL calculate dividend growth rate from historical dividend CAGR
4. THE Stockmeter System SHALL apply discount rate equal to required rate of return (8% to 12%)
5. WHERE a stock does not pay dividends, THE Stockmeter System SHALL display "N/A" for DDM fair value

### Requirement 17

**User Story:** As a stock investor, I want to see relative valuation metrics, so that I can compare the stock to industry peers

#### Acceptance Criteria

1. THE Stockmeter System SHALL calculate P/E ratio fair value using industry median P/E ratio
2. THE Stockmeter System SHALL calculate P/B ratio fair value using industry median P/B ratio
3. THE Stockmeter System SHALL calculate P/S ratio fair value using industry median P/S ratio
4. THE Stockmeter System SHALL retrieve industry peer data for at least 10 comparable companies
5. THE Stockmeter System SHALL display both company ratio and industry median for comparison

### Requirement 18

**User Story:** As a value investor, I want to see Graham Number valuation, so that I can identify conservatively valued stocks

#### Acceptance Criteria

1. THE Stockmeter System SHALL calculate Graham Number using earnings per share and book value per share
2. THE Stockmeter System SHALL apply Graham formula: square root of (22.5 × EPS × Book Value per Share)
3. THE Stockmeter System SHALL retrieve most recent annual EPS and book value from financial statements
4. WHERE EPS or book value is negative, THE Stockmeter System SHALL display "N/A" for Graham Number
5. THE Stockmeter System SHALL display Graham Number as fair value estimate
