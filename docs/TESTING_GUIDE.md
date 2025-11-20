# Stockmeter MVP Testing Guide

This guide provides comprehensive testing procedures for all user flows and features in the Stockmeter application.

## Prerequisites

Before testing, ensure:
1. Backend server is running on `http://localhost:3001`
2. Frontend server is running on `http://localhost:3000`
3. PostgreSQL database is running and migrated
4. Redis cache is running
5. Environment variables are properly configured

## Quick Start Testing

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run API tests (optional)
cd frontend
node -e "import('./utils/api-test.ts').then(m => m.runAPITests())"
```

## Test Scenarios

### 1. Authentication Flow

#### 1.1 User Registration
- [ ] Navigate to `/register`
- [ ] Fill in email, password, and name
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify redirect to home page
- [ ] Verify user is logged in (check profile menu)

**Expected Results:**
- User account created in database
- JWT token stored in cookies
- User redirected to home page
- Free tier subscription assigned

#### 1.2 User Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify redirect to home page

**Expected Results:**
- User authenticated successfully
- Session persists across page refreshes
- Access token auto-refreshes every 45 minutes

#### 1.3 OAuth Login (Google/Facebook)
- [ ] Click "Sign in with Google" button
- [ ] Complete OAuth flow
- [ ] Verify redirect back to application
- [ ] Verify user is logged in

**Expected Results:**
- User authenticated via OAuth
- Account created if first time
- Existing account linked if email matches

#### 1.4 Logout
- [ ] Click logout button
- [ ] Verify success toast appears
- [ ] Verify redirect to home page
- [ ] Verify user is logged out

**Expected Results:**
- Session cleared
- User redirected to home
- Protected routes inaccessible

### 2. Stock Search and Detail Flow

#### 2.1 Stock Search
- [ ] Navigate to home page
- [ ] Type "AAPL" in search bar
- [ ] Verify autocomplete dropdown appears
- [ ] Verify results show within 2 seconds
- [ ] Verify results include ticker, name, exchange

**Expected Results:**
- Search results cached for 5 minutes
- Maximum 20 results displayed
- Results ordered by relevance

#### 2.2 Stock Detail View
- [ ] Click on a stock from search results
- [ ] Verify navigation to `/stocks/[ticker]`
- [ ] Verify company profile loads
- [ ] Verify current price displays
- [ ] Verify fair value calculations appear

**Expected Results:**
- Stock profile cached for 5 minutes
- All 4 valuation models displayed (DCF, DDM, P/E, Graham)
- Valuation status color-coded (green/white/red)
- Add to watchlist button visible

#### 2.3 Model Details (Pro Only)
- [ ] Login as Pro user
- [ ] Navigate to stock detail page
- [ ] Click "View Detailed Breakdown"
- [ ] Verify navigation to `/stocks/[ticker]/details`
- [ ] Verify detailed calculations display

**Expected Results:**
- Detailed assumptions shown
- Projected cash flows table displayed
- Calculation steps explained
- Free users see upgrade prompt

### 3. Watchlist Functionality

#### 3.1 Add to Watchlist
- [ ] Login as user
- [ ] Navigate to stock detail page
- [ ] Click "Add to Watchlist"
- [ ] Verify success toast appears
- [ ] Navigate to `/watchlist`
- [ ] Verify stock appears in list

**Expected Results:**
- Stock added to database
- Watchlist updated immediately
- Free users limited to 5 stocks
- Pro users have unlimited

#### 3.2 Remove from Watchlist
- [ ] Navigate to `/watchlist`
- [ ] Click remove button on a stock
- [ ] Verify confirmation (if implemented)
- [ ] Verify stock removed from list

**Expected Results:**
- Stock removed from database
- UI updates immediately
- Success toast appears

#### 3.3 Watchlist Tier Limitations
- [ ] Login as free user
- [ ] Add 5 stocks to watchlist
- [ ] Attempt to add 6th stock
- [ ] Verify error message appears
- [ ] Verify upgrade prompt shown

**Expected Results:**
- Free users blocked at 5 stocks
- Clear error message displayed
- Link to pricing page provided

### 4. Batch Comparison Feature

#### 4.1 Comparison (Pro Users)
- [ ] Login as Pro user
- [ ] Navigate to `/compare`
- [ ] Add multiple stocks (up to 50)
- [ ] Verify comparison table loads
- [ ] Verify all fair values calculated
- [ ] Verify calculation completes within 10 seconds

**Expected Results:**
- All stocks compared simultaneously
- Results displayed in table format
- Sortable columns
- Color-coded valuation status

#### 4.2 Comparison (Free Users)
- [ ] Login as free user
- [ ] Navigate to `/compare`
- [ ] Attempt to add 2nd stock
- [ ] Verify upgrade prompt appears
- [ ] Verify limited to 1 stock

**Expected Results:**
- Free users see upgrade prompt
- Limited to single stock view
- Link to pricing page provided

#### 4.3 Export Results (Pro Only)
- [ ] Login as Pro user
- [ ] Navigate to `/compare` with stocks
- [ ] Click "Export Results"
- [ ] Select CSV format
- [ ] Verify file downloads

**Expected Results:**
- CSV file generated within 5 seconds
- All comparison data included
- File downloads automatically

### 5. Alert System (Pro Only)

#### 5.1 Create Alert
- [ ] Login as Pro user
- [ ] Navigate to `/alerts`
- [ ] Click "Create Alert"
- [ ] Fill in ticker, threshold type, value
- [ ] Submit form
- [ ] Verify success toast appears

**Expected Results:**
- Alert saved to database
- Alert appears in list
- Status set to "active"

#### 5.2 Toggle Alert Status
- [ ] Navigate to `/alerts`
- [ ] Click activate/deactivate button
- [ ] Verify status changes
- [ ] Verify UI updates

**Expected Results:**
- Alert status toggled
- Database updated
- UI reflects change immediately

#### 5.3 Delete Alert
- [ ] Navigate to `/alerts`
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Verify alert removed

**Expected Results:**
- Alert deleted from database
- Removed from UI immediately
- Success toast appears

#### 5.4 Alert Notifications
- [ ] Create alert with threshold
- [ ] Wait for scheduler to run (24 hours or trigger manually)
- [ ] Verify email sent when threshold met

**Expected Results:**
- Email sent within 15 minutes of threshold met
- Email includes stock details and fair value
- Alert history logged

### 6. Payment and Subscription

#### 6.1 View Pricing
- [ ] Navigate to `/pricing`
- [ ] Verify free and Pro plans displayed
- [ ] Toggle between monthly/yearly
- [ ] Verify pricing updates

**Expected Results:**
- Clear feature comparison
- Monthly: $12, Yearly: $99
- Yearly shows savings badge

#### 6.2 Subscribe to Pro
- [ ] Click "Subscribe" on Pro plan
- [ ] Select payment provider (Stripe/PayPal/Midtrans)
- [ ] Complete payment in test mode
- [ ] Verify redirect to success page
- [ ] Verify subscription status updated

**Expected Results:**
- Payment processed successfully
- User upgraded to Pro within 30 seconds
- Subscription expiry date set
- Access to Pro features granted

#### 6.3 Payment Webhooks
- [ ] Trigger test webhook from payment provider
- [ ] Verify subscription status updates
- [ ] Verify transaction recorded

**Expected Results:**
- Webhook signature verified
- User subscription updated
- Transaction logged in database

#### 6.4 Subscription Status
- [ ] Navigate to `/profile`
- [ ] Verify subscription status displayed
- [ ] Verify expiry date shown
- [ ] Verify payment history visible

**Expected Results:**
- Current status accurate
- Expiry date correct
- Payment history complete

### 7. Internationalization

#### 7.1 Language Switching
- [ ] Click language switcher
- [ ] Select Indonesian
- [ ] Verify UI text changes
- [ ] Navigate between pages
- [ ] Verify language persists

**Expected Results:**
- All UI text translated
- Language preference saved
- Persists across sessions

#### 7.2 Currency Conversion
- [ ] Navigate to `/profile`
- [ ] Change currency preference
- [ ] Navigate to stock pages
- [ ] Verify prices converted

**Expected Results:**
- All prices converted to selected currency
- Exchange rates updated within 24 hours
- Preference saved to profile

### 8. Mobile Responsiveness

#### 8.1 Mobile Layout
- [ ] Open app on mobile device or resize browser to 375px
- [ ] Navigate through all pages
- [ ] Verify layouts adapt properly
- [ ] Test touch interactions

**Expected Results:**
- All pages responsive (320px - 768px)
- Touch targets minimum 44px
- Tables scrollable horizontally
- No horizontal overflow

#### 8.2 Mobile Performance
- [ ] Test on 4G connection
- [ ] Measure initial page load time
- [ ] Verify images lazy load
- [ ] Test portrait and landscape

**Expected Results:**
- Initial load < 3 seconds on 4G
- Images lazy loaded
- Both orientations supported
- Smooth scrolling and transitions

### 9. Error Handling

#### 9.1 Network Errors
- [ ] Disconnect internet
- [ ] Attempt API call
- [ ] Verify error toast appears
- [ ] Reconnect internet
- [ ] Verify retry works

**Expected Results:**
- User-friendly error message
- Automatic retry with exponential backoff
- Maximum 2 retry attempts
- Clear feedback to user

#### 9.2 Authentication Errors
- [ ] Logout user
- [ ] Attempt to access protected route
- [ ] Verify redirect to login
- [ ] Verify error message

**Expected Results:**
- Redirect to login page
- Session expired message shown
- Return URL preserved

#### 9.3 Subscription Errors
- [ ] Login as free user
- [ ] Attempt Pro-only feature
- [ ] Verify upgrade prompt
- [ ] Verify link to pricing

**Expected Results:**
- Clear upgrade message
- Feature limitations explained
- Easy path to upgrade

### 10. Provider Failover

#### 10.1 Primary Provider Failure
- [ ] Simulate Yahoo Finance API failure
- [ ] Attempt stock search
- [ ] Verify failover to FMP
- [ ] Verify results still returned

**Expected Results:**
- Automatic failover within 5 seconds
- No user-visible errors
- Results from backup provider
- Provider health logged

#### 10.2 Rate Limit Handling
- [ ] Trigger rate limit on provider
- [ ] Verify switch to alternative
- [ ] Verify warning logged at 90%

**Expected Results:**
- Automatic provider switch
- Rate limits tracked per provider
- Warning logged before limit reached

## Performance Benchmarks

### Response Time Targets
- Stock search: < 2 seconds
- Stock profile: < 3 seconds
- Fair value calculation: < 5 seconds
- Batch comparison (50 stocks): < 10 seconds
- Export generation: < 5 seconds

### Caching Verification
- Stock prices: 5 minutes TTL
- Financial statements: 24 hours TTL
- Fair value: 1 hour TTL
- Search results: 5 minutes TTL

## Bug Tracking

When bugs are found:
1. Document the issue clearly
2. Include steps to reproduce
3. Note expected vs actual behavior
4. Capture screenshots/logs if applicable
5. Assign priority (Critical/High/Medium/Low)

## Test Completion Checklist

- [ ] All authentication flows tested
- [ ] Stock search and detail flows tested
- [ ] Watchlist functionality tested
- [ ] Batch comparison tested
- [ ] Alert system tested (Pro)
- [ ] Payment and subscription tested
- [ ] Internationalization tested
- [ ] Mobile responsiveness tested
- [ ] Error handling tested
- [ ] Provider failover tested
- [ ] Performance benchmarks met
- [ ] All tier limitations verified
- [ ] All webhooks tested
- [ ] Cache behavior verified

## Known Limitations

1. Financial data providers may have rate limits in free tiers
2. Some stocks may not have complete financial data
3. DDM model only applicable to dividend-paying stocks
4. Graham Number not applicable for negative earnings/book value
5. Industry peer data requires minimum 10 comparable companies

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Check browser console for frontend errors
- Review API responses in Network tab
- Contact development team with detailed bug reports
