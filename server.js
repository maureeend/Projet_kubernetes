const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./config/database');  // Importer la connexion à la DB

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route principale pour afficher le formulaire d'ajout d'utilisateur
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour ajouter un utilisateur
app.post('/users', (req, res) => {
  const { first_name, last_name, email } = req.body;
  const query = 'INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)';
  db.query(query, [first_name, last_name, email], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('<h1>Email déjà utilisé</h1><a href="/">Retour</a>');
      }
      console.error('Erreur lors de l\'insertion :', err);
      return res.status(500).send('Erreur serveur');
    }
    res.send(`<h1>Utilisateur ajouté avec succès</h1><a href="/">Retour</a>`);
  });
});

// Route pour afficher la page de recherche
app.get('/search-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// Route pour rechercher un utilisateur
app.get('/search', (req, res) => {
  const { query } = req.query;
  const sql = `
    SELECT * FROM users
    WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
  `;
  db.query(sql, [`%${query}%`, `%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error('Erreur lors de la recherche :', err);
      return res.status(500).send('<h1>Erreur serveur</h1><a href="/search-page">Retour</a>');
    }

    let response = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Résultats de la recherche</title>
        <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <div class="container">
          <h1>Résultats de la recherche</h1>
          <div class="card">
            <ul id="result-list">
    `;
    if (results.length === 0) {
      response += '<li>Aucun utilisateur trouvé</li>';
    } else {
      results.forEach(user => {
        response += `
          <li class="result-item">
            <span class="name">${user.first_name} ${user.last_name}</span>
            <span class="email">${user.email}</span>
          </li>`;
      });
    }
    response += `
            </ul>
          </div>
          <div class="text-center mt-4">
            <a href="/search-page" class="link">Retour à la recherche</a>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(response);
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Application Node.js en cours d'exécution sur le port ${port}`);
});
