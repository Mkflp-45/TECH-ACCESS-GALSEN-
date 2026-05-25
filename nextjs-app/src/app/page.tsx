export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/20 backdrop-blur-md">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Next.js ajouté au projet
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Ce dépôt contient désormais un projet Next.js prêt pour Vercel dans <code>nextjs-app</code>. Tu peux lancer l’application, puis continuer la migration des pages statiques vers React + Next.js.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-slate-300/40 hover:bg-white/10"
            href="/index.html"
          >
            <h2 className="text-xl font-semibold">Version statique</h2>
            <p className="mt-2 text-slate-400">Ouvre le site HTML actuel pour comparer.</p>
          </a>
          <a
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 transition hover:border-slate-300/40 hover:bg-white/10"
            href="https://vercel.com/new"
            target="_blank"
            rel="noreferrer"
          >
            <h2 className="text-xl font-semibold">Déploiement Vercel</h2>
            <p className="mt-2 text-slate-400">Next.js est prêt pour un déploiement simple sur Vercel.</p>
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-950/80 p-6 text-slate-300">
          <p className="font-medium text-slate-100">Commandes utiles</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-200">
            <code>cd nextjs-app</code>
            <br />
            <code>npm run dev</code>
            <br />
            <code>npm run build</code>
          </pre>
        </div>
      </div>
    </main>
  );
}
