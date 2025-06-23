const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
// Removed ObjectId import as it's no longer needed for mark-seen
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

// Set EJS view engine to look in Frontend/view for templates like messagebox.ejs
app.set('view engine', 'ejs');
// Dynamically determine the views directory path for EJS templates
const VIEWS_DIR = path.join(__dirname, '..', 'Frontend', 'view');
app.set('views', VIEWS_DIR);
console.log(`EJS views directory set to: ${VIEWS_DIR}`);

// Serve static files (HTML, CSS, JS, images, etc.) from the 'Frontend' folder.
const STATIC_FILES_DIR = path.join(__dirname, '..', 'Frontend');
app.use(express.static(STATIC_FILES_DIR));
console.log(`Serving static files from: ${STATIC_FILES_DIR}`);


// --- Explicit GET routes for main HTML pages ---
app.get('/', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signup.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signin.html'));
});

// Also handle direct .html requests if any links use them (e.g., in development)
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signup.html'));
});

app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(STATIC_FILES_DIR, 'signin.html'));
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
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB");
        mongoClient = client;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}

// API Routes

// Sign Up Route
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
            seen: false, // Messages will still be initialized as false
        });
        res.status(200).json({ success: true, message: 'Signup successful!' });
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).json({ success: false, message: 'Internal server error during signup.' });
    }
});

// Sign In Route
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

// Send Message Route
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
            seen: false, // Messages will still be initialized as false
        });
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error("Error inserting message:", error);
        res.status(500).json({ success: false, message: 'Internal server error sending message.' });
    }
});

// Fetch Messages Route (GET with query param)
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

// Removed the app.post('/messages/:id/mark-seen') endpoint

// Start server
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
});

