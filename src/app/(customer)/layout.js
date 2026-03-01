export const metadata = {
    title: 'Go To Mart — Order Groceries Online in Dimapur',
    description: 'Order groceries, snacks, drinks and everyday essentials online. Fast delivery in Dimapur, Nagaland.',
};

export default function CustomerLayout({ children }) {
    return (
        <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {children}
        </div>
    );
}
