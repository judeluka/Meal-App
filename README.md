# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Meal Order Management App

A comprehensive application for managing meal planning for groups and staff members with advanced scheduling capabilities.

## Features

### Core Functionality
- **Group Management**: Add, edit, and delete groups with detailed information
- **Staff Management**: Manage staff with live-in/live-out accommodation options
- **Meal Grid**: Weekly meal planning with automatic calculations
- **CSV Import**: Bulk import groups and staff from CSV files
- **Dashboard**: Overview of total meal counts and dietary requirements

### Advanced Scheduling (NEW)
Groups can now have multiple arrival and departure times on the same day with different participant counts:

#### Flexible Arrival/Departure Schedules
- **Multiple Time Slots**: Specify different arrival times for different participants within the same group
- **Participant Distribution**: Set how many people arrive/depart at each specific time
- **Meal Calculation**: Automatic meal planning based on individual arrival/departure schedules
- **Backward Compatibility**: Existing groups with single arrival/departure times continue to work seamlessly

#### How to Use Schedule Management
1. Navigate to any group's detail page
2. Click "Manage Times" in the Schedule card
3. Add multiple arrival/departure slots as needed:
   - Set the date, time, and number of people for each slot
   - Total participants across all slots must equal the group size
   - Click "Save Schedule" to apply changes

#### Example Use Cases
- **Split Arrivals**: 15 people arrive at 10:00 AM, 10 more arrive at 2:00 PM on the same day
- **Staggered Departures**: 8 people leave at 11:00 AM, remaining 12 leave at 4:00 PM
- **Mixed Schedules**: Different arrival dates and times for sub-groups within the same organization

### Meal Calculation Logic
- **Breakfast Threshold**: 09:00 - arrive before this time to get breakfast
- **Lunch Threshold**: 13:00 - arrive before this time to get lunch (or packed lunch on weekends)
- **Dinner Threshold**: 18:00 - arrive before this time to get dinner
- **Packed Meals**: Automatically provided when departing before meal times
- **Weekend Logic**: Saturday/Sunday lunches are automatically packed for all attendees
- **Staff Logic**: Live-in staff get all meals, live-out staff get lunch only

### Data Management
- **CSV Import**: Supports flexible column names and date formats (DD/MM/YYYY or YYYY-MM-DD)
- **API Integration**: Full CRUD operations with JSON server backend
- **Local Fallback**: Continues to work when API is unavailable

## Technology Stack
- **Frontend**: React 18 with React Router
- **Styling**: Tailwind CSS
- **Backend**: JSON Server (development)
- **CSV Processing**: Papa Parse
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
1. Start the JSON server (backend):
   ```bash
   npx json-server --watch db.json --port 3001
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

### CSV Import Format

#### Groups CSV
Required columns (case-insensitive):
- Agency (optional)
- Group Name
- Arrival Date (DD/MM/YYYY or YYYY-MM-DD)
- Departure Date (DD/MM/YYYY or YYYY-MM-DD)
- Total Px (number of people)

#### Staff CSV
Required columns (case-insensitive):
- First Name
- Surname
- Arrival Date (DD/MM/YYYY or YYYY-MM-DD)
- Departure Date (DD/MM/YYYY or YYYY-MM-DD)
- Live in? (Yes/No, optional - defaults to Yes)

## Project Structure
```
src/
├── components/          # Reusable React components
├── pages/              # Page components for routing
├── utils/              # Utility functions (meal calculator, etc.)
└── App.jsx             # Main application component
```

## Key Components
- **MealGridPage**: Weekly meal planning interface
- **GroupDetailPage**: Individual group management with schedule functionality
- **SettingsPage**: CSV import interface
- **DashboardPage**: Overview and statistics
- **MealCalculator**: Core logic for meal count calculations

## License
MIT License
