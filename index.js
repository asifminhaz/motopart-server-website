const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000

//middleware//
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yya0r.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT (req, res, next){
          const authHeader = req.headers.authorization;
          if(!authHeader){
            return res.status(401).send({message: 'Unauthorize access'})
          }
          const token = authHeader.split(' ')[1]
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
            if(err){
              return res.status(403).send({message: 'Forbidden access'})
            }
            req.decoded = decoded;
            next()
          })
}
 async function run (){
           try{
          await client.connect();
          const toolCollection = client.db('motoparts').collection('tools')
          const userCollection = client.db('motoparts').collection('users')
          const ordersCollection = client.db('motoparts').collection('orders')

          app.get('/orders/:email', verifyJWT, async(req, res)=> {
                    const email = req.params.email;
                    // const authorization = req.headers.authorization
                    const decodedEmail = req.decoded.email;
                    if(email === decodedEmail){
                      const query = {email: email}
                      const orders = await ordersCollection.find(query).toArray()
                      res.send(orders)

                    }
                    else{
                      return res.status(403).send({message: 'Forbidden access'})
                    }
                   

          })
          app.get('/tool', async(req, res) => {
                    const query = {}
                    const cursor = toolCollection.find(query)
                    const tools = await cursor.toArray();
                    res.send(tools)
          })
          app.get('/tool/:id', async(req, res) =>{
                    const id = req.params.id;
                    const query={_id: ObjectId(id)};
                    const tool = await toolCollection.findOne(query);
                    res.send(tool);
                });

                app.get('/user', verifyJWT, async (req, res)=> {
                  const users = await userCollection.find().toArray()
                  res.send(users)
                })

                app.put('/user/admin/:email', async (req, res) => {   
                    const email = req.params.email;     
                    const initiator = req.decoded.email
                    const initiatorAccount = await userCollection.findOne({email: initiator})
                    if(initiatorAccount.role === 'admin')    {
                      const filter = { email: email };
                      const updatedDoc = {
                        $set: {role: 'admin'},
                      };
                            const result = await userCollection.updateOne(filter, updatedDoc)
                      
                            res.send(result)

                    }       
                    else{
                      res.status(403).send({message: "Forbidden"})
                    }
                   
                })
                app.put('/user/:email', async (req, res) => {
                    const name = req.body      
                    const email = req.params.email;
                    const user = req.body;
                    const filter = { email: email };
                    const options = { upsert: true };
                    const updatedDoc = {
                      $set: user,
                    };
                          const result = await userCollection.updateOne(filter, updatedDoc, options, name)
                          const token = jwt.sign({email : email}, process.env.ACCESS_TOKEN_SECRET,{expiresIn : '1d'})
                          res.send({result, token})
                })

                app.post('/orders', async (req, res) => {
                    const newOrders = req.body;
                    const result = await ordersCollection.insertOne(newOrders)
                    res.send(result)
                })

               

                app.put('/user/admin/:email',  async (req, res) => {
                    const email = req.params.email;
                    const filter = { email: email };
                    const updateDoc = {
                      $set: { role: 'admin' },
                    };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.send(result);
                  })
              

           }
           finally{

           }
 }

run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('hello world')
})

app.listen(port, () => {
          console.log('motoparts is on', port)
})