# Amazon Product Scraper

A Fullstack Web Application to extract Amazon product listings using Bun (backend) and Vite (frontend).

## Features

- **Backend with Bun**: REST API with Express for Amazon scraping
- **Frontend with Vite**: Modern and responsive interface
- **Data extraction**: Title, rating, reviews, image, and price
- **User-friendly interface**: Modern design with loading, error, and success states
- **Responsive**: Works on desktop and mobile
- **Error handling**: Clear feedback for the user

## Prerequisites

- [Bun](https://bun.sh/) installed (version 1.0 or higher)
- [Node.js](https://nodejs.org/) installed (version 16 or higher)
- Modern web browser

## Installation in your pc i recommend to use your cmd, powershell 

1. **Clone the repository** (if applicable):
```bash
git clone <repository-url>
cd amazon-scraper
```

2. **Install backend dependencies**:
```bash
bun install
```

3. **Install frontend dependencies**:
```bash
cd client
npm install
cd ..
```

4. **Or use the complete install command**:
```bash
npm run install-all
```

## How to Run

### Development (Recommended)

1. **Start the backend server**:
```bash
npm run dev
```

2. **In another terminal, start the frontend**:
```bash
cd client
npm run dev
```

3. **Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production

1. **Build the frontend**:
```bash
npm run build
```

2. **Start the server**:
```bash
npm start
```

3. **Access**: http://localhost:3000

## 📁 Project Structure

```
amazon-scraper/
├── server/
│   └── index.js          # Express server with scraping API
├── client/
│   ├── index.html        # Main page
│   ├── style.css         # CSS styles
│   ├── main.js           # Frontend JavaScript logic
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
├── public/               # Static files
├── package.json          # Backend dependencies
└── README.md             # Project documentation
```

## API Endpoints

### GET `/api/scrape`
Extracts Amazon products based on a keyword.

**Parameters:**
- `keyword` (string, required): Search keyword

**Example:**
```bash
curl "http://localhost:3000/api/scrape?keyword=smartphone"
```

**Response:**
```json
{
  "success": true,
  "keyword": "smartphone",
  "products": [
    {
      "id": 1,
      "title": "Smartphone XYZ",
      "rating": "4.5 stars",
      "reviews": "1,234",
      "imageUrl": "https://...",
      "productUrl": "https://amazon.com.br/...",
      "price": "R$ 999,99"
    }
  ],
  "total": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET `/api/health`
Checks the server status.

**Response:**
```json
{
  "success": true,
  "message": "Server running normally",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## User Interface

### Interface Features

- **Search field**: Enter the product keyword
- **Search button**: Starts the scraping process
- **Visual states**:
  - Loading: Loading animation
  - Error: Error message with retry button
  - Results: Grid of found products
  - Empty: Message when no products are found

### Design Features

- **Responsive**: Adapts to different screen sizes
- **Modern**: Design with gradients and glass effects
- **Accessible**: Proper contrast and keyboard navigation
- **Animated**: Smooth transitions and visual feedback

## How It Works

### Backend (Bun + Express)

1. **Receives request** with keyword
2. **Makes HTTP request** to Amazon Brazil
3. **Parses HTML** using JSDOM
4. **Extracts product data** (title, rating, etc.)
5. **Returns JSON** with found products

### Frontend (Vite + JavaScript)

1. **Search interface** for the user
2. **Makes AJAX request** to the backend
3. **Shows states** (loading, error, success)
4. **Renders products** in responsive cards
5. **Allows navigation** to product pages

## Important Considerations

### Scraping Limitations

- **Rate Limiting**: Amazon may limit excessive requests
- **Structure changes**: CSS selectors may need updates
- **Captcha**: May appear for automated requests
- **Terms of Service**: Respect Amazon's terms

### Error Handling

- **Connection**: Returns sample data if unable to connect
- **Timeout**: 10 seconds for requests
- **Validation**: Checks if keyword is provided
- **Feedback**: Clear error messages for the user

## Security

- **CORS**: Configured to allow frontend requests
- **Validation**: Checks input parameters
- **Headers**: Simulates real browser to avoid blocking
- **Timeout**: Prevents long-running requests

## Available Commands

```bash
# Development
npm run dev              # Starts server in watch mode
npm start                # Starts server in production

# Frontend
npm run install-client   # Installs frontend dependencies
npm run build            # Builds frontend for production

# Installation
npm run install-server   # Installs backend dependencies
npm run install-all      # Installs all dependencies
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Customization

- **CSS Selectors**: Edit `server/index.js` to adjust extraction
- **Styles**: Modify `client/style.css` to customize appearance
- **Behavior**: Adjust `client/main.js` to change frontend logic

## Logs

The server displays useful logs:
- Received requests
- Accessed URLs
- Number of products found
- Connection or parsing errors

## 📄 License
This project is under the MIT license. See the LICENSE file for details.

## Technologies Used

- **Backend**: Bun, Express, Axios, JSDOM
- **Frontend**: Vite, HTML5, CSS3, JavaScript ES6+
- **Design**: CSS Grid, Flexbox, Gradients, Animations
- **Icons**: Font Awesome
- **Fonts**: Google Fonts using Inter
