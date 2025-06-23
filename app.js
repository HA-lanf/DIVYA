const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Load environment variables from .env file (for local development)
dotenv.config();

const app = express();
// Use process.env.PORT for Render, fallback to 3000 for local
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_KEY; // MongoDB connection URI

let mongoClient; // Variable to hold the connected MongoDB client

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// --- START: PATH DEBUGGING & ROBUST PATHS FOR FLAT REPO ---
console.log('--- RENDER PATH DEBUGGING INFO (Flat Repo) ---');
console.log(`1. Current Working Directory (process.cwd()): ${process.cwd()}`);
console.log(`2. __dirname (app.js location): ${__dirname}`);

// For a flat repository, the project root IS the current working directory.
const PROJECT_ROOT = process.cwd(); 

// Static files (HTML, CSS, JS, images) are directly in the project root.
const STATIC_FILES_DIR = PROJECT_ROOT; 

// EJS views are in a 'view' subfolder directly in the project root.
const VIEWS_DIR = path.join(PROJECT_ROOT, 'view');

console.log(`3. Calculated Static Files Directory (STATIC_FILES_DIR): ${STATIC_FILES_DIR}`);
console.log(`4. Calculated EJS Views Directory (VIEWS_DIR): ${VIEWS_DIR}`);
console.log('------------------------------------');
// --- END: PATH DEBUGGING & ROBUST PATHS FOR FLAT REPO ---

// Set EJS view engine to look in the 'view' subfolder
app.set('view engine', 'ejs');
app.set('views', VIEWS_DIR); // Use the robust path

// Serve static files (HTML, CSS, JS, images, etc.) from the project root.
app.use(express.static(STATIC_FILES_DIR));


// --- Explicit GET routes for main HTML pages (directly in root) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'index.html'), (err) => {
        if (err) {
            console.error(`Error sending index.html: ${err.message}`);
            res.status(404).send('Could not find index.html at expected path on server.');
        }
    });
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signup.html'), (err) => {
        if (err) {
            console.error(`Error sending signup.html: ${err.message}`);
            res.status(404).send('Could not find signup.html at expected path on server.');
        }
    });
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signin.html'), (err) => {
        if (err) {
            console.error(`Error sending signin.html: ${err.message}`);
            res.status(404).send('Could not find signin.html at expected path on server.');
        }
    });
});

// Also handle direct .html requests if any links use them (e.g., in development)
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signup.html'), (err) => {
        if (err) {
            console.error(`Error sending signup.html directly: ${err.message}`);
            res.status(404).send('Could not find signup.html at expected path on server.');
        }
    });
});

app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signin.html'), (err) => {
        if (err) {
            console.error(`Error sending signin.html directly: ${err.message}`);
            res.status(404).send('Could not find signin.html at expected path on server.');
        }
    });
});


// MongoDB connection
async function connectToMongo() {
    try {
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        await client.connect(); // Connect to MongoDB
        await client.db("admin").command({ ping: 1 }); // Ping to confirm connection
        console.log("✅ Connected to MongoDB");
        mongoClient = client; // Store client for later use
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        // Exit process if MongoDB connection fails as it's critical
        process.exit(1);
    }
}

// API Routes (unchanged)
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Missing username or password.' });
    }
    try {
        const user = await mongoClient.db("DIVYA").collection("CREDENTIALS").findOne({ username });
        if (user) {
            return res.status(409).json({ success: false, message: 'User already exists.' });
        }
        await mongoClient.db("DIVYA").collection("CREDENTIALS").insertOne({ username, password });
        await mongoClient.db("DIVYA").collection("MESSAGES").insertOne({
            username,
            message: "Welcome to the app! Aditya this side.",
            timestamp: new Date(),
            seen: false, 
        });
        res.status(200).json({ success: true, message: 'Signup successful!' });
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).json({ success: false, message: 'Internal server error during signup.' });
    }
});

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    try {
        const user = await mongoClient.db("DIVYA").collection("CREDENTIALS").findOne({ username });
        if (user && user.password === password) {
            res.status(200).json({ success: true, message: 'Sign-in successful!' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).json({ success: false, message: 'Internal server error during sign-in.' });
    }
});

app.post('/index', async (req, res) => {
    const { username, message } = req.body;
    if (!username || !message) {
        return res.status(400).json({ success: false, message: 'Username and message are required.' });
    }
    try {
        const userExists = await mongoClient.db("DIVYA").collection("CREDENTIALS").findOne({ username });
        if (!userExists) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        await mongoClient.db("DIVYA").collection("MESSAGES").insertOne({
            username,
            message,
            timestamp: new Date(),
            seen: false, 
        });
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error("Error inserting message:", error);
        res.status(500).json({ success: false, message: 'Internal server error sending message.' });
    }
});

app.get('/messagebox', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).send("Username query parameter is required.");
    }
    try {
        const messages = await mongoClient.db("DIVYA").collection("MESSAGES")
            .find({ username })
            .sort({ timestamp: -1 })
            .toArray();
        res.render("messagebox", { messages, username });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error fetching messages.");
    }
});

// Start server
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
});


