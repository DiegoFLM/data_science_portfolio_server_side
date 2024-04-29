require('dotenv').config();

var express = require('express');
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');


var app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({
    origin: '*',  // Allows all domains
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;


app.use((req, res, next) => {
    console.log('Incoming Request:', req.method, req.path);
    console.log('Headers:', req.headers);
    next();
});




// Configure the transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or another email provider
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
//     console.log("GET / called")
//     res.send("Hello World");
    try{
        const persons = await client.db("test").collection("persons").find().toArray();
        res.status(200).json(persons);
    }catch(err){
        res.status(500).json({error: err.message})
    }
});


app.post("/", async (req, res) => {
    try{
        const newPerson = req.body;
        const result = await client.db("test").collection("persons").insertOne(newPerson);

        // Send email
        const mailOptions = {
            from: 'diegolassoo@gmail.com',
            to: 'diego.ledesma@correounivalle.edu.co',
            subject: 'New Comment Added',
            text: `A new comment has been added: ${JSON.stringify(newPerson)}`
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log('Email send error:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(201).json(result);

    }catch(err){
        res.status(500).json({error: err.message})
    }
})


app.put('/', async function (req, res) {
    try {
    
        const {id, ...updateFields} = req.body;

    //   const personId = req.body.id;
    //   const updatedPerson = req.body;
        const result = await client.db("test").collection("persons").updateOne(
            // { _id: ObjectId(personId) },
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );
        if (result.modifiedCount > 0) {
            // res.status(200).send("Person updated successfully");
            res.status(200).json({message: "Person updated successfully"});
        } else {
            // res.status(404).send("Person not found");
            res.status(404).json({error: "Person not found"});
        }
    } catch (err) {
    //   res.end("Person not updated");
        console.error("Error during update:", err);
        res.status(500).json({error: "Person not updated"});
    }
});


app.delete('/', async function (req, res) {
    try {
        const personId = req.body.id;
        console.log(personId);
        const result = await client.db("test").collection("persons").deleteOne({ _id: new ObjectId(personId) });
        if (result.deletedCount > 0) {
            res.status(200).json({message:"Person deleted successfully"});
        } else {
            res.status(404).json({error:"Person not found"});
        }
    } catch (err) {
        // res.end("Person not deleted");
        console.error("Error during delete:", err);
        res.status(500).json({error: "Person not deleted"});
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})

