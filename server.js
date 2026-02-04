import express from 'express';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import cors from 'cors';



dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  
)

const ML_KEY = process.env.ML_KEY;

//newsletter id will be available once it has been intergrated 
const MAILERLITE_GROUPS = {
  waitinglist:'167870225453155482',
  newsletter: "YOUR_NEWSLETTER_GROUP_ID"
};

app.post('/api/subscribe',async (req,res)=> {
  const {email,carMake,type} = req.body;

  const car_make = carMake

  console.log('carMake :',car_make,'CAR :',carMake)

  if(!email || !type) {
    return res.status(400).json({error:"Email or Type required."});

  }

  try {
    const groupId = MAILERLITE_GROUPS[type] || MAILERLITE_GROUPS.newsletter;

    const mailerRes = await fetch(
      `https://connect.mailerlite.com/api/subscribers`,
      {
        method:'POST',
        headers:{
          Authorization: `Bearer ${ML_KEY}`,
          "Content-Type" : 'application/json'
        },
        body:
          JSON.stringify({
            email,
            fields:{carMake},
            groups :[groupId]
          })
        
      }
    );

    // const mailerData = await mailerRes.json();

    const mailerData = await mailerRes.text();
      // console.log("RAW RESPONSE:", mailerData);

    if (!mailerRes.ok) {
      console.error('MailerLite Error :',mailerData);
      return res.status(400).json({error:'Failed to sub to ML'});
    }

    
    const { data, error } = await supabase
      .from("newsletter")
      .insert([{ email, car_make }]);

    if (error){
      console.error('Supabase Error :',error.message)
      throw error
    } ;

    
    res.json({ success: true, message: "Subscription successful!" });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

  


app.listen(3000, () => console.log("Server running on port 3000"));
