# Nederlandse Adres Opzoeker - Next.js

Een volledig werkend Next.js applicatie voor het opzoeken van Nederlandse adressen via PostcodeAPI.nu.

## 🚀 Features

- **Server-side API route** - API key veilig opgeslagen in backend
- **React frontend** - Moderne component met hooks
- **PostcodeAPI.nu integratie** - Officiële Nederlandse postcode database
- **Error handling** - Duidelijke foutmeldingen
- **Loading states** - Gebruiksvriendelijke interface
- **Test functionaliteit** - Automatische testdata

## 📁 Project Structuur

```
├── app/
│   ├── api/address/route.js    # Server-side API route
│   └── page.jsx               # Homepage
├── components/
│   └── PostcodeLookup.jsx     # Frontend component
├── package.json
└── README.md
```

## 🛠️ Installatie

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:3000
   ```

## 🎯 Gebruik

### Test Data
- **Postcode:** `9711AC`
- **Huisnummer:** `10`
- Klik op "Test" knop voor automatische invoer

### API Endpoint
```
POST /api/address
Content-Type: application/json

{
  "postcode": "9711AC",
  "huisnummer": "10"
}
```

### Response
```json
{
  "straatnaam": "Grote Markt",
  "huisnummer": "10",
  "postcode": "9711 AC",
  "plaats": "Groningen",
  "provincie": "Groningen",
  "gemeente": "Groningen",
  "latitude": 53.2193835,
  "longitude": 6.5665018,
  "fullAddress": "Grote Markt 10, 9711 AC Groningen"
}
```

## 🔧 Technische Details

### API Route (`app/api/address/route.js`)
- **Method:** POST
- **Input:** `{ postcode, huisnummer }`
- **External API:** `https://postcodeapi.nu/api/v3/lookup/{postcode}/{huisnummer}`
- **Headers:** `X-Api-Key`, `Accept: application/json`
- **Error handling:** 400, 401, 404, 500 status codes

### Frontend Component (`components/PostcodeLookup.jsx`)
- **React hooks:** `useState` voor state management
- **Form handling:** Controlled inputs
- **Loading states:** Spinner tijdens API calls
- **Error display:** Duidelijke foutmeldingen
- **Success display:** Gestructureerde adres informatie

## 🎨 Styling

Gebruikt Tailwind CSS classes voor moderne styling:
- Responsive design
- Loading animations
- Error/success states
- Clean typography

## 🔒 Security

- **API key** opgeslagen in server-side code
- **Input validation** voor postcode formaat
- **Error handling** voor alle edge cases
- **CORS** niet nodig door server-side API

## 📝 Error Handling

- **400:** Ongeldige input (postcode formaat)
- **401:** API key ongeldig
- **404:** Adres niet gevonden
- **500:** Technische fout

## 🧪 Testing

1. Klik op "Test" knop voor automatische testdata
2. Of vul handmatig in: `9711AC` + `10`
3. Controleer console voor API requests
4. Verifieer response data

## 🚀 Deployment

```bash
npm run build
npm start
```

Perfect voor Vercel, Netlify, of andere Next.js hosting providers.