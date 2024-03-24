import dotenv from 'dotenv';
dotenv.config();

class ContactInfo{
    constructor(){
        this.contactInfo = {
            name:process.env.DEFAULT_NAME,
            methods:{
                phone:process.env.DEFAULT_PHONE,
                instagram:process.env.DEFAULT_INSTAGRAM
              }
        }
    }
}

export default ContactInfo;