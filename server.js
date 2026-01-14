const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

const Client = mongoose.model("Client", new mongoose.Schema({
  cid:String,
  visits:{ type:Number, default:0 },
  redeemed:{ type:Boolean, default:false }
}));

app.get("/visit/:cid", async (req,res)=>{
  const { cid } = req.params;

  let client = await Client.findOne({ cid });
  if(!client){
    client = await Client.create({ cid });
  }

  if(client.redeemed){
    return res.json({ msg:"تم استخدام الوجبة المجانية بالفعل." });
  }

  client.visits++;
  if(client.visits >= 5){
    client.redeemed = true;
    await client.save();
    return res.json({ msg:"🎉 مبروك! لك وجبة مجانية!", code: cid });
  }

  await client.save();
  res.json({ msg:"تم تسجيل زيارتك", left: 5 - client.visits });
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server started");
});
