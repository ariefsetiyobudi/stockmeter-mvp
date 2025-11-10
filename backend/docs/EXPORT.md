# Export Functionality

## Overview

The export functionality allows Pro tier users to download fair value analysis results in CSV or PDF format. This feature is implemented according to requirements 9.1, 9.2, 9.3, 9.4, and 9.5.

## Features

- **CSV Export**: Generate comma-separated values file with all fair value data
- **PDF Export**: Generate formatted PDF report with branding and tables
- **Pro Subscription Required**: Only Pro tier users can access export functionality
- **Performance**: Files generated within 5 seconds
- **Batch Support**: Export up to 50 stocks simultaneously

## API Endpoint

### GET /api/download

Export fair value data in CSV or PDF format.

**Authentication**: Required (Pro subscription)

**Query Parameters**:
- `format` (required): Export format - either `csv` or `pdf`
- `tickers` (required): Comma-separated list of stock tickers (max 50)

**Example Requests**:

```bash
# CSV Export
curl -X GET "http://localhost:3001/api/download?format=csv&tickers=AAPL,GOOGL,MSFT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# PDF Export
curl -X GET "http://localhost:3001/api/download?format=pdf&tickers=AAPL,GOOGL,MSFT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
- **Success (200)**: File download with appropriate Content-Type and Content-Disposition headers
- **Unauthorized (401)**: Authentication required
- **Forbidden (403)**: Pro subscription required
- **Bad Request (400)**: Invalid parameters or too many tickers
- **Timeout (504)**: Export generation exceeded 5 second limit
- **Not Found (404)**: No valid data available for export
- **Internal Error (500)**: Export generation failed

## CSV Format

The CSV export includes the following columns:

1. Ticker
2. Company Name
3. Current Price
4. DCF Fair Value
5. DDM Fair Value
6. P/E Fair Value
7. P/B Fair Value
8. P/S Fair Value
9. Graham Number
10. Average Fair Value
11. Valuation Status
12. Calculated At

**Example CSV Output**:

```csv
Ticker,Company Name,Current Price,DCF Fair Value,DDM Fair Value,P/E Fair Value,P/B Fair Value,P/S Fair Value,Graham Number,Average Fair Value,Valuation Status,Calculated At
AAPL,AAPL,150.25,160.50,155.00,158.00,152.00,156.00,145.00,154.42,Undervalued,2024-01-01T00:00:00.000Z
GOOGL,GOOGL,140.00,N/A,N/A,145.00,N/A,N/A,N/A,145.00,Fairly Priced,2024-01-01T00:00:00.000Z
```

## PDF Format

The PDF export includes:

1. **Header**: Stockmeter branding and report title
2. **Summary Section**: 
   - Total stocks analyzed
   - Count of undervalued, fairly priced, and overvalued stocks
3. **Detailed Analysis Table**:
   - Ticker
   - Current Price
   - DCF, DDM, P/E, Graham fair values
   - Average fair value
   - Valuation status
4. **Footer**: Disclaimer text

The PDF is formatted with:
- A4 page size
- Professional table layout
- Automatic page breaks for large datasets
- Consistent branding

## Implementation Details

### ExportService

Located at `backend/src/services/export.service.ts`

**Methods**:

1. `generateCSV(data: FairValueResult[]): string`
   - Generates CSV string from fair value data
   - Handles null/undefined values as "N/A"
   - Properly escapes commas and quotes
   - Calculates average fair value

2. `generatePDF(data: FairValueResult[]): Promise<Buffer>`
   - Generates PDF buffer using pdfkit library
   - Creates formatted table with all fair value data
   - Includes summary statistics
   - Adds branding and disclaimer

### Export Routes

Located at `backend/src/routes/export.routes.ts`

**Features**:
- Authentication and Pro subscription validation
- Query parameter validation using Zod
- Ticker parsing and normalization
- Fair value data fetching with caching
- 5-second timeout for performance
- Proper error handling and logging

## Error Handling

The export functionality includes comprehensive error handling:

1. **Validation Errors**: Invalid format or missing tickers
2. **Authentication Errors**: Missing or invalid JWT token
3. **Authorization Errors**: Free tier users attempting export
4. **Timeout Errors**: Export generation exceeds 5 seconds
5. **Data Errors**: No valid data available for requested tickers
6. **Generation Errors**: PDF or CSV generation failures

All errors return appropriate HTTP status codes and descriptive error messages.

## Testing

Unit tests are located at `backend/src/services/export.service.test.ts`

**Test Coverage**:
- CSV generation with valid data
- CSV generation with missing values
- CSV escaping of special characters
- PDF generation with single stock
- PDF generation with multiple stocks

Run tests:
```bash
npm test -- export.service.test.ts
```

## Performance Considerations

1. **Caching**: Fair value data is cached for 1 hour to reduce API calls
2. **Parallel Processing**: Multiple stock calculations run in parallel
3. **Timeout**: 5-second limit ensures responsive API
4. **Batch Limit**: Maximum 50 stocks to prevent performance issues
5. **Streaming**: PDF generation uses streaming to handle large datasets

## Security

1. **Authentication Required**: All export requests must include valid JWT token
2. **Pro Subscription Check**: Middleware validates subscription status
3. **Input Validation**: Zod schemas validate all query parameters
4. **Rate Limiting**: Standard API rate limits apply
5. **No PII Exposure**: Only stock data is included in exports

## Future Enhancements

Potential improvements for future versions:

1. Excel (XLSX) format support
2. Custom column selection
3. Chart/graph inclusion in PDF
4. Email delivery option
5. Scheduled exports
6. Export history tracking
7. Custom branding options
