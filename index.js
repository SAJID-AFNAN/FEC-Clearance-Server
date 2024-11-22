//dependencies
const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');


require('dotenv').config()
const port = 3000


app.use(cors())
app.use(express.json())


const uri = process.env.MDB_CONNECTION_STRING;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("FEC_Clearence");
    const studentsCollection = db.collection("students");

    app.get("/students",async(req,res)=>{
        const email = req.query.email;
        const resp = studentsCollection.find({}).toArray();
        res.send(resp);
    })

    app.post("/students",async(req,res)=>{
        const data = req.body;
        const email = data.email;
        const isUserExist = await studentsCollection.findOne({email: email})
        if(isUserExist){
          throw new Error("user already exists");
        }
        const resp = await studentsCollection.insertOne(data);
        res.send(isUserExist);
    })

    app.get("/student/:email",async(req,res)=>{
      const email = req.params.email;
      const result = await studentsCollection.findOne({email: email});
      res.send(result);
    })

    app.put("/student/update/:email",async(req,res)=>{
      const email = req.params.email;
      const data = req.body;
      const filter = {email: email}
      const result = await studentsCollection.updateOne(filter,{$set: data},{upsert: false});
      res.send(result);
    })

    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.log);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

//nothing to say

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})