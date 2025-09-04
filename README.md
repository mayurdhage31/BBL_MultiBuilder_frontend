# BBL Multi Builder Frontend

A modern, responsive web interface for the BBL (Big Bash League) Multi Builder application. Built with vanilla HTML, CSS, and JavaScript with a dark theme design inspired by the NRL Multi Builder.

## 🎨 Features

- **Modern Dark Theme**: Professional dark interface with green accents
- **BBL Branding**: Orange gradient logo matching BBL colors
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Interactive UI**: Smooth animations and hover effects
- **Real-time Updates**: Dynamic content based on user selections

## 🚀 Deployment

### Vercel (Recommended)
This project is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. The `vercel.json` configuration will handle the deployment automatically
3. No build step required - it's a static site

### Local Development
```bash
# Serve locally
python -m http.server 3000

# Or use any static file server
npx serve .
```

## 📱 Usage Flow

1. **Select Match**: Choose from available BBL fixtures
2. **Predict Winner**: Click on your predicted winning team
3. **Build Multi**: Get intelligent betting recommendations
4. **Select Bets**: Choose from top percentage player markets
5. **View Bet Slip**: Review your multi-bet with combined odds

## 🔧 Configuration

### API Integration
The frontend connects to the BBL Multi Builder API:
- Default: `http://localhost:8000`
- Update `API_BASE_URL` in `script.js` for production

### Supported Betting Markets
- **Batting**: 10+ runs, 20+ runs, hit a six, TTRS
- **Bowling**: 1+ wickets, 2+ wickets, top team wicket taker

## 📁 File Structure

```
Frontend/
├── index.html        # Main application interface
├── styles.css        # Styling and responsive design
├── script.js         # Application logic and API integration
├── vercel.json       # Vercel deployment configuration
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🎯 Design Features

- **League Selector**: BBL, AFL, NRL options (BBL active)
- **Match Dropdown**: Dynamic match selection
- **Winner Buttons**: Interactive team selection with trophy icons
- **Recommendations**: Checkbox-based bet selection
- **Bet Slip**: Real-time multi-bet builder

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 License

This project is for educational and demonstration purposes.
