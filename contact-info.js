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

    createContact(name, phone, email, platform, handle) {
        const contact = {};
    
        // Helper function to add non-empty values
        const addProperty = (key, value) => {
            if (value !== null && value !== undefined && value.trim() !== '') {
                contact[key] = value.trim(); // Trim and add if not null/undefined/blank
            }
        };
    
        // Add properties if they're not null, undefined, or blank
        addProperty("name", name);
        addProperty("phone", phone);
        addProperty("email", email);
        addProperty(platform, handle);
    
        return contact;
    }
}

export default ContactInfo;