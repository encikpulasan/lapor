# Lapor - Neighbourhood Pollution Reporting System

A web application that enables residents to report air pollution issues (smell,
smoke, etc.) anonymously or via registration. The system collects key data with
minimal input and forwards reports to relevant authorities via the SISPAA
channel.

## Features

- **Anonymous & Registered Reporting**: Users can submit reports without
  creating an account or sign up for tracking
- **Automatic Location Detection**: Uses IP geolocation to determine approximate
  user location
- **Device Fingerprinting**: Generates unique device identifiers to prevent
  duplicate reports
- **Multiple Pollution Types**: Support for smell, smoke, noise, water, air,
  waste, chemical, and other pollution types
- **Sector-based Organization**: Reports are organized by area sectors (1-5)
- **Admin Dashboard**: Complete admin panel for viewing, filtering, and
  exporting reports
- **SISPAA Integration**: Ready for integration with government reporting
  systems
- **Responsive Design**: Works on both desktop and mobile devices

## Tech Stack

- **Frontend**: Preact, TailwindCSS, Fresh Islands
- **Backend**: Deno, Fresh 2.0 Framework
- **Database**: DenoKV (built-in key-value store)
- **Authentication**: Session-based with secure password hashing
- **Location Services**: IP-based geolocation (ipapi.co, ip-api.com)

## Installation

1. **Install Deno** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd lapor
   ```

3. **Start the development server**:
   ```bash
   deno task dev
   ```

4. **Open your browser** and navigate to `http://localhost:8000`

## Usage

### For Citizens

1. **Visit the homepage** to submit a pollution report
2. **Select pollution type** (smell, smoke, etc.) and your sector
3. **Add optional description** for more details
4. **Submit the report** - location and device info are captured automatically
5. **Optionally register** to track your reports and receive updates

### For Administrators

1. **Admin account is created automatically** on first server start with default
   credentials:
   - Email: `admin@lapor.local`
   - Password: `Admin123!` (change this immediately!)
2. **Configure custom admin credentials** via environment variables
   (recommended):
   ```bash
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=YourSecurePassword123!
   ADMIN_NAME=System Administrator
   ADMIN_PHONE=+60123456789
   ```
3. **Access admin panel** at `/admin` after logging in
4. **View all reports** with filtering by sector, type, or user
5. **Export data** as CSV for external analysis
6. **Monitor report statistics** and submission status

## Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```bash
# Admin Account (recommended for production)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator
ADMIN_PHONE=+60123456789

# SISPAA Integration (when available)
SISPAA_API_URL=https://api.sispaa.gov.my
SISPAA_API_KEY=your_api_key_here

# Development
DENO_ENV=development
```

**⚠️ Security Note**: Always change the default admin password in production!

### Database

The application uses DenoKV, which requires no additional setup for development.
Data is stored locally in a KV file.

For production deployment, configure DenoKV with a proper connection string if
needed.

## API Endpoints

### Reports

- `POST /api/reports` - Submit new pollution report
- `GET /api/reports` - Get all reports (admin only)

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

## Data Schema

### Pollution Report

```json
{
  "report_id": "01HKQJPG2HJ8K3M4N5P6Q7R8S9T0UV",
  "timestamp": "2025-01-17T14:35:00Z",
  "ip_address": "192.168.1.100",
  "location": {
    "city": "Johor Bahru",
    "lat": 1.4927,
    "lon": 103.7414
  },
  "device_id": "abc123def456",
  "pollution_type": "smell",
  "sector": 3,
  "user_id": "01HKQJPG2HJ8K3M4N5P6Q7R8S9", // null for anonymous
  "status": "pending", // pending | submitted | failed
  "description": "Strong chemical smell from nearby factory",
  "created_at": "2025-01-17T14:35:00Z",
  "updated_at": "2025-01-17T14:35:00Z"
}
```

## SISPAA Integration

The system is prepared for integration with Malaysia's SISPAA (Sistem Pengurusan
Aduan Awam) system:

- **Automatic forwarding**: Reports are automatically submitted to SISPAA after
  creation
- **Status tracking**: System tracks submission status
  (pending/submitted/failed)
- **Retry mechanism**: Failed submissions are queued for retry
- **Format transformation**: Reports are transformed to SISPAA-expected format
- **Reference tracking**: SISPAA reference IDs are stored for follow-up

To enable SISPAA integration, configure the environment variables with proper
API credentials.

## Development

### Project Structure

```
lapor/
├── lib/              # Core services and utilities
│   ├── db.ts         # Database operations and schemas
│   ├── auth.ts       # Authentication utilities  
│   ├── location.ts   # IP geolocation services
│   ├── device.ts     # Device fingerprinting
│   └── sispaa.ts     # SISPAA integration
├── routes/           # Fresh routes
│   ├── index.tsx     # Homepage with report form
│   ├── admin/        # Admin panel routes
│   ├── auth/         # Authentication routes
│   └── api/          # API endpoints
├── islands/          # Interactive components
│   ├── ReportForm.tsx      # Main report submission form
│   ├── AdminDashboard.tsx  # Admin dashboard
│   ├── LoginForm.tsx       # User login form
│   └── RegisterForm.tsx    # User registration form
├── components/       # Reusable components
└── static/          # Static assets
```

### Adding Features

1. **New pollution types**: Update `VALID_POLLUTION_TYPES` in
   `/routes/api/reports.ts`
2. **Additional sectors**: Modify `VALID_SECTORS` array
3. **Custom fields**: Extend the `PollutionReport` interface in `/lib/db.ts`
4. **New APIs**: Add routes in `/routes/api/`
5. **UI components**: Create new islands or components

### Testing

```bash
# Run linting and type checking
deno task check

# Run the application
deno task dev

# Build for production
deno task build
```

## Deployment

1. **Build the application**:
   ```bash
   deno task build
   ```

2. **Deploy to your preferred platform** (Deno Deploy, Railway, etc.)

3. **Configure environment variables** for production

4. **Set up SISPAA integration** with proper API credentials

## License

[Add your license information here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For support or questions, please [create an issue](link-to-issues) or contact
the development team.
