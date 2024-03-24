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

    createContact(name,phone,email,platform,handle){
        const contact = {};
        contact["name"]=name;
        contact["phone"]=phone;
        contact["email"]=email;
        contact[platform]=handle;

        // Iterate over the object's properties to trim each value
        for (let key in contact) {
            if (typeof contact[key] === 'string') { // Check if the value is a string
                contact[key] = contact[key].trim();
            }
        }
        return contact;
    }
}

export default ContactInfo;