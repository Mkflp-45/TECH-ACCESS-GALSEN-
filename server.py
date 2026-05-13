import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

print('🚀 Démarrage du serveur local sur http://localhost:8000')
print('📁 Ouvrez index.html ou admin.html pour tester')
print('🔍 Vérifiez la console du navigateur pour les logs Firestore')

try:
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Serveur démarré sur le port {PORT}')
        httpd.serve_forever()
except KeyboardInterrupt:
    print('Serveur arrêté')