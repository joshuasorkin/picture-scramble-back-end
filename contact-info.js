import dotenv from 'dotenv';
dotenv.config();

class ContactInfo{
    constructor(){
        this.default = {
            name:process.env.DEFAULT_NAME,
            phone:process.env.DEFAULT_PHONE,
            instagram:process.env.DEFAULT_INSTAGRAM
        }
    }
}

export default ContactInfo;