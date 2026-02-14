# Shift Scheduler

AI-powered shift scheduling web application with work-life balance considerations, built with GitHub Copilot SDK integration.

## Features

- 🗓️ **Shift Management**: Create, view, and manage employee shifts
- 👥 **Employee Management**: Add employees with work hour limits and preferred days off
- 🏖️ **Absence Tracking**: Register vacations, sick leave, and holidays
- ⚡ **Smart Scheduling**: Generate schedules with work-life balance considerations
- 🤖 **AI-Powered**: Optional GitHub Copilot SDK integration for intelligent scheduling
- 📋 **Manual Mode**: Works perfectly without AI when Copilot SDK is not available
- ⚖️ **Work-Life Balance**: Respects maximum hours per week and preferred days off

## Setup Instructions

### Prerequisites

- Node.js 14.0.0 or higher
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AlexanderErdelyi/schift-scheduler.git
   cd schift-scheduler
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Optional: GitHub Copilot SDK Integration

To enable AI-powered scheduling, you need to install and configure the GitHub Copilot SDK:

1. **Install GitHub Copilot SDK:**
   ```bash
   npm install @github/copilot-sdk
   ```

2. **Configure Copilot CLI:**
   Follow the [GitHub Copilot SDK documentation](https://github.com/github/copilot-sdk) to set up the Copilot CLI.

3. **Restart the application:**
   The application will automatically detect the Copilot SDK and enable AI features.

**Note**: The application works perfectly in manual mode even without Copilot SDK. The AI features are optional enhancements.

## Usage Guide

### 1. Add Employees

1. Go to the "👥 Employees" tab
2. Click "+ Add Employee"
3. Fill in:
   - Employee name
   - Maximum hours per week (for work-life balance)
   - Preferred days off (e.g., weekends)
4. Click "Save"

### 2. Register Absences

1. Go to the "🏖️ Absences" tab
2. Click "+ Add Absence"
3. Select employee, date, and reason (vacation, sick leave, etc.)
4. Click "Save"

### 3. Generate Schedule

1. Go to the "⚡ Generate" tab
2. Set date range for the schedule
3. Configure shifts per day and hours per shift
4. Choose generation mode:
   - **📋 Generate (Manual)**: Rule-based algorithm (always available)
   - **🤖 Generate (AI)**: AI-powered optimization (requires Copilot SDK)
5. View generated schedule in the "📅 Schedule" tab

### 4. View and Manage Schedule

1. Go to the "📅 Schedule" tab
2. Filter by date or employee
3. Review assigned shifts
4. Delete shifts if needed

## How It Works

### Manual Scheduling Algorithm

The manual scheduler considers:
- Employee work hour limits (no overtime)
- Preferred days off
- Registered absences and holidays
- Fair distribution of shifts among employees
- Continuous coverage for all time slots

### AI Scheduling (with Copilot SDK)

When GitHub Copilot SDK is available, the AI scheduler:
- Analyzes all constraints and preferences
- Optimizes for work-life balance
- Considers complex patterns and fairness
- Generates more sophisticated schedules
- Learns from scheduling patterns

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `COPILOT_CLI_PATH`: Path to Copilot CLI (optional, auto-detected)

### Data Storage

Currently uses in-memory storage (data resets on server restart). For production:
- Integrate a database (MongoDB, PostgreSQL, etc.)
- Modify `server.js` to use persistent storage

## Architecture

```
schift-scheduler/
├── server.js           # Express backend with API endpoints
├── public/
│   ├── index.html      # Main web interface
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## API Endpoints

- `GET /api/employees` - List all employees
- `POST /api/employees` - Add new employee
- `GET /api/shifts` - List all shifts
- `POST /api/shifts` - Add shift
- `DELETE /api/shifts/:id` - Delete shift
- `GET /api/absences` - List all absences
- `POST /api/absences` - Register absence
- `POST /api/schedule/generate` - Generate schedule (manual)
- `POST /api/schedule/generate-ai` - Generate schedule (AI)
- `GET /api/copilot/status` - Check Copilot availability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Credits

Built with [GitHub Copilot SDK](https://github.com/github/copilot-sdk) integration.
