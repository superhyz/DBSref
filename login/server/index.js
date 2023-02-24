
const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken") //to generate signed token
const User = require("./models/usermodel")
const bcrypt = require("bcrypt") //to hash the password
const app= express()
const mongoose = require("mongoose")

//middleware , function that manipulates the request before it reaches the route handler
app.use(cors()) //cors is a middleware that allows us to make requests from one origin to another
app.use(express.json()) // to parse the body of the request



mongoose.connect("mongodb://0.0.0.0:27017/Userdb") //0.0.0.0:27017 new version , old localhost:27017
.then(() => {
    console.log("MONGO CONNECTION OPEN!!!")
})
.catch(err => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!")
    console.log(err)
})

app.listen(4000,()=>{
    console.log("Server is listening on port 4000")
})




//registration
app.post("/api/register",  async (req,res)=>{
    console.log(req.body)
    try{
        const newPassword = await bcrypt.hash(req.body.password,10) //hash the password
        //insert into db
        await User.create({
            name: req.body.name,
            email: req.body.email,
            password: newPassword,
        })
        res.json({status:'ok'}) //no return because we want to continue the function
    }catch(err){
        res.json({status:'error', error: 'Duplicate email'})
    }
    
})


app.post("/api/login",  async (req,res)=>{
    //find in db
    const user = await User.findOne({
        email: req.body.email,
        // password: req.body.password,
    })
    if (!user) { return res.json({status: "error",error: "Invalid email or password"})}
    
    const isPasswordValid = await bcrypt.compare(req.body.password,user.password) //compare the password
    if (isPasswordValid) {
        //generate token
        const token = jwt.sign({
            //payload
            email: user.email,
            password: user.password
        },"secret123") //secret key 2nd parameter means that the token is signed with this key
        
        //send token to client
        return res.json({status: "ok",token:token}) //return to stop the function
        
    }else{
        return res.json({status: "error",user:false})
    }
})

//get quote
app.get("/api/quote",  async (req,res)=>{
    //get token from client
    const token = req.headers["x-access-token"]
    console.log("inside get token: "+JSON.stringify(token))
    try{
        //verify token
        const decoded = jwt.verify(token,"secret123")
        //if token is valid, return the payload
        const email = decoded.email
        const user = await User.findOne({email: email})
        
        return res.json({status: "ok",quote: user.quote})
    }catch(err){
        console.log(err)
        res.json({status: "error",error: "Invalid token"})
    }
})

//update quote
app.post("/api/quote",  async (req,res)=>{
    //get token from client
    const token = req.headers["x-access-token"]
    console.log("inside post token: "+JSON.stringify(token))
    try{
        //verify token
        const decoded = jwt.verify(token,"secret123")
        //if token is valid, return the payload
        const email = decoded.email
        //update quote
        await User.updateOne(
            {email: email},
            {$set:{quote: req.body.quote}}
        )
        
        return res.json({status: "ok"})
    }catch(err){
        console.log(err)
        res.json({status: "error",error: "Invalid token"})
    }
})