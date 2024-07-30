const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult } = require('express-validator');

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Use express-ejs-layouts
app.use(expressLayouts);

// Set the directory for views
app.set('views', __dirname + '/views');

// Serve static files
app.use(express.static('public'));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Array to store contact data
let contacts = [];

// Define a route with main layout
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', layout: 'layouts/main' });
});

// Define a route with alternate layout
app.get('/about', (req, res) => {
  res.render('about', { title: 'About', layout: 'layouts/main' });
});

// Define a route to display the contact form and contacts list
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact', layout: 'layouts/main', contacts, errors: [] });
});

// Define a route to handle form submissions
app.post('/contact',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('phone').matches(/^\+?62[0-9]{9,12}$/).withMessage('Invalid Indonesian phone number')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('contact', { title: 'Contact', layout: 'layouts/main', contacts, errors: errors.array() });
    }

    const { name, email, phone } = req.body;
    contacts.push({ name, email, phone });
    res.redirect('/contact');
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
