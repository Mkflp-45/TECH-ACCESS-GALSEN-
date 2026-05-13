import json
import os

print('=== ANALYSE DES DONNÉES LOCALES ===')

# Simuler la lecture des données depuis localStorage
local_data_file = 'localStorage_sim.json'
if os.path.exists(local_data_file):
    with open(local_data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        products = data.get('products', [])
        print(f'Produits dans localStorage simulé: {len(products)}')
        for p in products:
            name = p.get('name', '?')
            pid = p.get('id', '?')
            print(f'  - {name} ({pid})')
else:
    print('Pas de fichier localStorage simulé trouvé')

print('\n=== VÉRIFICATION DES FICHIERS ===')
files_to_check = ['index.html', 'admin.html']
for file in files_to_check:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            firestore_count = content.count('loadProductsFromFirestore')
            render_count = content.count('renderProducts')
            print(f'{file}: {firestore_count} appels Firestore, {render_count} appels render')
    else:
        print(f'{file}: FICHIER MANQUANT')

print('\n=== CONFIGURATION DÉPLOIEMENT ===')
if os.path.exists('netlify.toml'):
    print('Netlify: Configuré')
if os.path.exists('vercel.json'):
    print('Vercel: Configuré')

print('\n=== ANALYSE DU CODE ===')

# Vérifier si les produits sont rendus correctement
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
    if 'adminData.products.map' in content:
        print('✅ index.html: Les produits sont rendus depuis adminData.products')
    else:
        print('❌ index.html: Problème dans le rendu des produits')

    if 'loadProductsFromFirestore()' in content:
        print('✅ index.html: Firestore est appelé pour charger les produits')
    else:
        print('❌ index.html: Firestore n\'est pas appelé')

# Vérifier admin.html
with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()
    if 'currentData.products.map' in content:
        print('✅ admin.html: Les produits sont rendus depuis currentData.products')
    else:
        print('❌ admin.html: Problème dans le rendu des produits')