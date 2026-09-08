# SEO — à finaliser

Deux choses à faire toi-même une fois le site en ligne :

## 1. Remplacer le domaine placeholder
`TON-DOMAINE.com` apparaît à 4 endroits — remplace-le par ta vraie URL (ex: `techaccess.netlify.app` ou ton nom de domaine) :
- `index.html` (balises `<link rel="canonical">`, `og:*`, `twitter:*`)
- `robots.txt` (ligne `Sitemap:`)
- `sitemap.xml` (toutes les balises `<loc>`)

Recherche/remplace global sur ces 3 fichiers, c'est le plus rapide.

## 2. Créer une image de partage (og-image)
`index.html` référence `assets/og-image.jpg`, qui n'existe pas encore. C'est l'image qui s'affiche quand quelqu'un partage ton lien sur WhatsApp/Facebook/X. Recommandé :
- Format : **1200×630px**, JPG ou PNG, < 300 Ko
- Contenu : ton logo + un visuel produit + le nom "TECH ACCESS"
- Une fois créée, dépose-la dans `assets/og-image.jpg`

## Une fois ces deux points faits
Tu peux soumettre ton sitemap à Google Search Console (gratuit) pour accélérer l'indexation : https://search.google.com/search-console
