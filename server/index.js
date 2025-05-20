const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Submit a blog
app.post('/submit-blog', (req, res) => {
    const { title, content, category, author, user_id } = req.body;
    
    if (!title || !content || !category || !author || !user_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = 'INSERT INTO blogs (title, content, category, author, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, content, category, author, user_id], (err, result) => {
        if (err) {
            console.error('Error inserting blog:', err);
            return res.status(500).json({ error: 'Error saving blog' });
        }
        res.status(200).json({ message: 'Blog posted successfully', blogId: result.insertId });
    });
});

// Get all blogs
app.get('/blogs', (req, res) => {
    const query = 'SELECT * FROM blogs ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            return res.status(500).json({ error: 'Error fetching blogs' });
        }
        res.json(results);
    });
});

// Update a blog
app.put('/blogs/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = 'UPDATE blogs SET title = ?, content = ?, category = ? WHERE id = ?';
    db.query(query, [title, content, category, id], (err, result) => {
        if (err) {
            console.error('Error updating blog:', err);
            return res.status(500).json({ error: 'Error updating blog' });
        }
        res.status(200).json({ message: 'Blog updated successfully' });
    });
});

// Delete a blog
app.delete('/blogs/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM blogs WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting blog:', err);
            return res.status(500).json({ error: 'Error deleting blog' });
        }
        res.status(200).json({ message: 'Blog deleted successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});