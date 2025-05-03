const express = require('express');
const path = require('path');
const app = express();

// Sirve archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// API para las vistas (opcional, pero útil para SPA)
app.get('/views/:view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', `${req.params.view}.html`));
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('Servidor listo en http://localhost:3000'));