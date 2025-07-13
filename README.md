# FlipSheet

Generates a single one-pager for wholesalers to share their off-market properties. Minimal overhead.

## Tech Stack

- ⚡ **Next.js 14** with App Router and TypeScript
- 🔥 **Supabase** for backend-as-a-service
- 🎨 **Tailwind CSS** for modern, responsive design
- 📱 **Mobile-first** responsive design
- 🔒 **Type-safe** with TypeScript

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

2. Install dependencies:


3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
flipsheet/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   │   └── ExampleForm.tsx # Example Supabase form
│   └── supabaseClient.ts   # Supabase client configuration
├── public/                 # Static assets
├── .env.local             # Environment variables
└── package.json           # Dependencies
```


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
