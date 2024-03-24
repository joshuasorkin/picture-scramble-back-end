import dotenv from 'dotenv';
dotenv.config();

class ContactInfo{
    constructor(){
        this.contactInfo = {
            name:process.env.DEFAULT_NAME,
            methods:[
              {
                type:"phone",
                value:process.env.DEFAULT_PHONE
              },
              {
                type:"instagram",
                value:process.env.DEFAULT_INSTAGRAM
              }
            ]
          }
    }
}

export default ContactInfo;