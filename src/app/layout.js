import './globals.css';

export const metadata = {
    title: 'Go To Mart — Fast • Fresh • Everyday Essentials',
    description: 'Get groceries, snacks, drinks, and everyday essentials delivered fast in Dimapur. Order from Go To Mart for quick delivery!',
    keywords: 'grocery delivery, Dimapur, quick delivery, Go To Mart, essentials',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <meta name="theme-color" content="#1a1464" />
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
