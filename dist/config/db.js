import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const mongourl = process.env.MONGO_URL;
const connectdb = async () => {
    try {
        await mongoose.connect(mongourl);
        console.log(`Mongodb is connected successfully`);
    }
    catch (error) {
        console.log(`Mongo error ${error}`);
    }
};
export default connectdb;
//# sourceMappingURL=db.js.map