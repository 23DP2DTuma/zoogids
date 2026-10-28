import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="py-20 text-center">
            <div className="text-7xl">🐾</div>
            <h1 className="mt-4 text-3xl font-extrabold">Lapa nav atrasta</h1>
            <p className="mt-2 text-ink/60">Šķiet, kāds šo lapu ir apracis dārzā.</p>
            <Link to="/" className="btn-primary mt-6">
                Uz sākumu
            </Link>
        </div>
    );
}
