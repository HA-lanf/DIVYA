const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_KEY;

let mongoClient;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../Frontend/view'));
app.use(express.static(path.join(__dirname, '../Frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
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
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error fetching messages.");
    }
});

connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
});
