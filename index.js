//dependencies
const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = 3000

app.use(cors())
app.use(express.json())

// MongoDB connection string
const uri = process.env.MDB_CONNECTION_STRING;

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let studentsCollection; // Declare this in the outer scope

async function run() {
  try {
    console.log('running the function');
    await client.connect();
    const db = client.db("FEC_Clearence");
    studentsCollection = db.collection("students"); // Assign the collection to the global variable

    // Routes using studentsCollection
    app.get("/student", async (req, res) => {
      console.log('into the get req of students');
      const resp = await studentsCollection.find({}).toArray();
      res.send(resp);
    });

    app.post("/students", async (req, res) => {
      const data = req.body;
      const email = data.email;
      const isUserExist = await studentsCollection.findOne({ email: email });
      if (isUserExist) {
        return res.status(400).send("User already exists");
      }
      const resp = await studentsCollection.insertOne(data);
      res.send(resp);
    });

    app.get("/student/:email", async (req, res) => {
      console.log('this is from personal detail');
      const email = req.params.email;
      const result = await studentsCollection.findOne({ email: email });
      res.send(result);
    });
    app.get('/students/verified', async (req, res) => {
      try {
        const verifiedStudents = await studentsCollection.find({ verified: true }).toArray();
        res.status(200).json(verifiedStudents);
      } catch (error) {
        console.error("Error fetching verified students:", error);
        res.status(500).json({ error: "Internal server error. Please try again later." });
      }
    });
    

    app.put("/student/update/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      const filter = { email: email };
      const result = await studentsCollection.updateOne(filter, { $set: data }, { upsert: false });
      res.send(result);
    });

    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Run the database connection function
run().catch(console.dir);

// Verification route (can now access studentsCollection)
app.post('/student/:email/verify', async (req, res) => {
  const { email } = req.params;
  const { signature } = req.body;

  if (!signature) {
    return res.status(400).json({ error: "Signature is required." });
  }

  try {
    const result = await studentsCollection.updateOne(
      { email }, // Match the student by email
      {
        $set: {
          signature,    // Update the signature field with the provided base64 string
          verified: true // Set the verified status to true
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Student not found." });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "Failed to update verification. No changes were made." });
    }

    res.json({ message: "Verification successful!" });
  } catch (err) {
    console.error("Error updating verification:", err);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send(`connected to database`);
});

// Start the server
app.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});
