const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');

// Set EJS as the templating engine
app.set('view engine', 'ejs');

app.use(morgan('dev'));

// Use express-ejs-layouts
app.use(expressLayouts);

// Set the directory for views
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Function to read contacts from JSON file
const readContacts = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data/contact.json'));
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading contact.json:', error);
    return [];
  }
};

// Function to write contacts to JSON file
const writeContacts = (contacts) => {
  fs.writeFileSync(path.join(__dirname, 'data/contact.json'), JSON.stringify(contacts, null, 2));
};

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
  const contacts = readContacts();
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
      const contacts = readContacts();
      return res.render('contact', { title: 'Contact', layout: 'layouts/main', contacts, errors: errors.array() });
    }

    const { name, email, phone } = req.body;
    const contacts = readContacts();
    contacts.push({ id: Date.now(), name, email, phone });
    writeContacts(contacts);
    res.redirect('/contact');
  }
);

// Define a route to display the edit form
app.get('/contact/edit/:id', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === parseInt(req.params.id));
  if (!contact) {
    return res.redirect('/contact');
  }
  res.render('edit', { title: 'Edit Contact', layout: 'layouts/main', contact, errors: [] });
});

// Define a route to handle the update
app.post('/contact/update/:id',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('phone').matches(/^\+?62[0-9]{9,12}$/).withMessage('Invalid Indonesian phone number')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const contact = { id: parseInt(req.params.id), ...req.body };
      return res.render('edit', { title: 'Edit Contact', layout: 'layouts/main', contact, errors: errors.array() });
    }

    const { name, email, phone } = req.body;
    const contacts = readContacts();
    const index = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (index !== -1) {
      contacts[index] = { id: parseInt(req.params.id), name, email, phone };
      writeContacts(contacts);
    }
    res.redirect('/contact');
  }
);

// Define a route to handle the delete
app.post('/contact/delete/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.filter(c => c.id !== parseInt(req.params.id));
  writeContacts(contacts);
  res.redirect('/contact');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
