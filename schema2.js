var mongoose = require('mongoose')

const {Schema} = mongoose


var url = new Schema({
    longurl:String,
    shorturl:String,
   
     email:{
         type:String
     }   
},{
    timestamps:true
})

module.exports= mongoose.model('url',url)